// ============================================================
// TOJI Admin — Blog composer (شكل زي فيسبوك: اكتب وانزل بسهولة)
// ============================================================
(function () {
    const API = window.TojiAPI;
    if (!API) return;

    const titleInput   = document.getElementById('fbPostTitle');
    const contentInput = document.getElementById('fbPostContent');
    const tagsInput    = document.getElementById('fbPostTags');
    const publishToggle = document.getElementById('fbPublishToggle');
    const publishBtn   = document.getElementById('fbPublishBtn');
    const cancelEditBtn = document.getElementById('fbCancelEditBtn');
    const msgEl         = document.getElementById('fbComposerMsg');

    const imageInput   = document.getElementById('fbImageInput');
    const photoBtn      = document.getElementById('fbPhotoBtn');
    const imagePreview  = document.getElementById('fbImagePreview');
    const imagePreviewImg = document.getElementById('fbImagePreviewImg');
    const imageRemoveBtn  = document.getElementById('fbImageRemoveBtn');

    const feedEl    = document.getElementById('blogFeed');
    const loadBtn   = document.getElementById('blogLoadBtn');

    if (!titleInput || !contentInput || !feedEl) return;

    let uploadedImageUrl = '';
    let editingId = null;
    let editingSlug = '';
    let allPosts = [];

    function slugify(text) {
        const base = String(text || '')
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 80);
        const suffix = Date.now().toString(36).slice(-5);
        return base ? `${base}-${suffix}` : `post-${suffix}`;
    }

    function setMsg(text, isError) {
        msgEl.textContent = text;
        msgEl.className = 'form-msg' + (isError ? ' is-error' : ' is-success');
    }

    function resetComposer() {
        titleInput.value = '';
        contentInput.value = '';
        tagsInput.value = '';
        publishToggle.checked = true;
        uploadedImageUrl = '';
        imagePreview.hidden = true;
        imagePreviewImg.src = '';
        editingId = null;
        editingSlug = '';
        publishBtn.textContent = 'نشر';
        cancelEditBtn.hidden = true;
        msgEl.textContent = '';
        msgEl.className = 'form-msg';
    }

    // ── رفع صورة (نفس الباترن المستخدم في باقي اللوحة) ──
    imageInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setMsg('⏳ جارٍ رفع الصورة...');
        try {
            const formData = new FormData();
            formData.append('image', file);
            const token = API.TokenManager.get();
            const res = await fetch(`${API.API_BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'فشل رفع الصورة');
            uploadedImageUrl = data.url;
            imagePreviewImg.src = data.url;
            imagePreview.hidden = false;
            msgEl.textContent = '';
        } catch (err) {
            setMsg(err.message, true);
        } finally {
            imageInput.value = '';
        }
    });

    imageRemoveBtn?.addEventListener('click', () => {
        uploadedImageUrl = '';
        imagePreview.hidden = true;
        imagePreviewImg.src = '';
    });

    cancelEditBtn?.addEventListener('click', resetComposer);

    // ── نشر / حفظ تعديل ──
    publishBtn?.addEventListener('click', async () => {
        const content = contentInput.value.trim();
        if (!content) { setMsg('اكتب حاجة الأول 🙂', true); return; }

        const title = titleInput.value.trim() || content.split('\n')[0].slice(0, 80);
        const tags  = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean);
        const excerpt = content.slice(0, 200);

        const payload = {
            title,
            excerpt,
            content,
            coverImage: uploadedImageUrl,
            tags,
            isPublished: publishToggle.checked
        };
        if (!editingId) payload.slug = slugify(title);

        publishBtn.disabled = true;
        setMsg(editingId ? '⏳ جارٍ الحفظ...' : '⏳ جارٍ النشر...');
        try {
            if (editingId) {
                await API.BlogAPI.update(editingId, payload);
                setMsg('✅ اتحفظ التعديل.');
            } else {
                await API.BlogAPI.create(payload);
                setMsg('✅ اتنشر البوست!');
            }
            resetComposer();
            loadFeed();
        } catch (err) {
            setMsg(err.message || 'حصل خطأ.', true);
        } finally {
            publishBtn.disabled = false;
        }
    });

    function formatDate(d) {
        if (!d) return '';
        return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function startEdit(post) {
        editingId = post._id;
        editingSlug = post.slug;
        titleInput.value = post.title || '';
        contentInput.value = post.content || '';
        tagsInput.value = (post.tags || []).join(', ');
        publishToggle.checked = !!post.isPublished;
        uploadedImageUrl = post.coverImage || '';
        if (uploadedImageUrl) {
            imagePreviewImg.src = uploadedImageUrl;
            imagePreview.hidden = false;
        } else {
            imagePreview.hidden = true;
        }
        publishBtn.textContent = 'حفظ التعديلات';
        cancelEditBtn.hidden = false;
        document.getElementById('fbComposer').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function deletePost(id) {
        if (!confirm('متأكد إنك عايز تمسح البوست ده؟')) return;
        try {
            await API.BlogAPI.remove(id);
            loadFeed();
        } catch (err) {
            alert(err.message || 'فشل الحذف.');
        }
    }

    function renderFeed(posts) {
        if (!posts.length) {
            feedEl.innerHTML = '<p class="projects-hint">لسه مفيش بوستات. اكتب أول بوست فوق 👆</p>';
            return;
        }
        feedEl.innerHTML = posts.map((post) => `
            <article class="fb-feed-item" data-id="${post._id}">
                ${post.coverImage ? `<img class="fb-feed-item-img" src="${post.coverImage}" alt="">` : ''}
                <div class="fb-feed-item-body">
                    <div class="fb-feed-item-meta">
                        <span class="fb-status ${post.isPublished ? 'is-published' : 'is-draft'}">${post.isPublished ? '🟢 منشور' : '🟡 مسودة'}</span>
                        <span class="fb-feed-item-date">${formatDate(post.createdAt)}</span>
                    </div>
                    <h4>${escapeHtml(post.title)}</h4>
                    <p>${escapeHtml((post.excerpt || post.content || '').slice(0, 140))}${(post.excerpt || post.content || '').length > 140 ? '…' : ''}</p>
                    ${(post.tags || []).length ? `<div class="fb-feed-item-tags">${post.tags.map((t) => `<span>#${escapeHtml(t)}</span>`).join('')}</div>` : ''}
                    <div class="fb-feed-item-actions">
                        <button type="button" data-act="edit">✏️ تعديل</button>
                        <button type="button" data-act="delete">🗑 حذف</button>
                        <a href="blog-post.html?slug=${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">👁 شوفه لايف</a>
                    </div>
                </div>
            </article>`).join('');
    }

    feedEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.closest('.fb-feed-item').dataset.id;
        const post = allPosts.find((p) => String(p._id) === id);
        if (!post) return;
        if (btn.dataset.act === 'edit') startEdit(post);
        if (btn.dataset.act === 'delete') deletePost(id);
    });

    async function loadFeed() {
        feedEl.innerHTML = '<p class="projects-hint">⏳ جارٍ التحميل...</p>';
        try {
            const res = await API.BlogAPI.getAll();
            allPosts = res.data || [];
            renderFeed(allPosts);
        } catch (err) {
            feedEl.innerHTML = `<p class="projects-hint is-error">تعذر تحميل البوستات: ${err.message}</p>`;
        }
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    loadBtn?.addEventListener('click', loadFeed);

    // ── تحميل تلقائي أول ما بانل المدونة يتفتح ──
    const panel = document.getElementById('blogPanel');
    panel?.addEventListener('toggle', () => {
        if (panel.open && !panel.dataset.loaded) {
            panel.dataset.loaded = '1';
            loadFeed();
        }
    });
})();
