// ============================================================
// TOJI — زعزع Tour: جولة موجّهة section بـ section على الصفحة الرئيسية.
//    بتتفعّل من زرار الكمباس في الدوك، وبتستخدم نفس نظام النافيجيشن
//    الموجود بالفعل (بتدوس على زرار الدوك الحقيقي لكل قسم) عشان
//    تفضل متزامنة مع أي تغيير في محتوى/ترتيب الأقسام.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById('dockTourBtn');
    const card        = document.getElementById('zazaTourCard');
    if (!triggerBtn || !card) return;

    const stepLabel = document.getElementById('zazaTourStep');
    const textEl    = document.getElementById('zazaTourText');
    const skipBtn   = document.getElementById('zazaTourSkip');
    const prevBtn   = document.getElementById('zazaTourPrev');
    const nextBtn   = document.getElementById('zazaTourNext');

    // ── نص زعزع لكل قسم معروف. أي قسم مش في القايمة بياخد نص عام،
    //    فالجولة متتكسرش لو اتضاف قسم جديد مستقبلًا ──
    const CAPTIONS = {
        home:      'يا هلا 👋 أنا زعزع، هوريك الموقع في دقيقة. الصفحة الرئيسية هنا فيها لمحة سريعة عن Toji وأهم حاجة يعرفها أي حد بيزور الموقع.',
        expertise: 'القسم ده بيحكي عن خبرة Toji وإزاي بيفكر وهو بيبني أي صفحة — مش بس تصميم شكلي، ده بيهتم بالتفاصيل والأداء كمان.',
        work:      'هنا هتلاقي أنواع الصفحات والأنظمة اللي Toji بيقدر يبنيها أو يطورها ليك، من موقع بسيط لحد نظام متكامل.',
        projects:  'دي شغل Toji الفعلي، مشاريع حقيقية اتعملت. دوس على أي مشروع تشوف تفاصيله وتجرب الديمو لو موجود.',
        wip:       'القسم ده بيوضح إيه اللي Toji شغال عليه دلوقتي — شفافية كاملة، تقدر تتابع تقدم أي مشروع لسه ماخلصش.',
        songs:     'دي الأغاني اللي Toji بيسمعها وهو بيشتغل 🎧 حاجة شخصية شوية، بس بتديك لمحة عن ذوقه واهتمامه بالتفاصيل.',
        connect:   'هنا كل طرق التواصل مع Toji مباشرة — واتساب، السوشيال ميديا، وكل حاجة تقدر تتواصل بيها.',
        guestbook: 'ودّي كلمة في دفتر الزوار ده! سيب أثرك، وزعزع بيرد على بعض الرسايل بردود لطيفة 😄'
    };
    const DEFAULT_CAPTION = 'القسم ده كمان جزء من الموقع، اتفرج عليه بنفسك 🙂';

    let steps    = [];
    let idx      = 0;
    let active   = false;
    let glowNode = null;

    function collectSteps() {
        const btns = Array.from(document.querySelectorAll('.dock-btn[data-target]'))
            .filter(b => b.offsetParent !== null || !b.hasAttribute('hidden'));
        // إزالة التكرار (نفس الـ target ممكن يبقى ليه أكتر من زرار: nav-link + dock-btn)
        const seen = new Set();
        return btns
            .map(b => b.dataset.target)
            .filter(id => {
                if (!id || seen.has(id)) return false;
                if (!document.getElementById(id)) return false;
                seen.add(id);
                return true;
            });
    }

    function clearGlow() {
        if (glowNode) { glowNode.classList.remove('zaza-tour-highlight'); glowNode = null; }
    }

    function goToSectionViaDock(id) {
        const btn = document.querySelector(`.dock-btn[data-target="${id}"]`);
        if (btn) btn.click();
        else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderStep() {
        const id = steps[idx];
        if (!id) return;

        goToSectionViaDock(id);

        clearGlow();
        const target = document.getElementById(id);
        if (target) {
            glowNode = target;
            requestAnimationFrame(() => glowNode?.classList.add('zaza-tour-highlight'));
        }

        stepLabel.textContent = `${idx + 1}/${steps.length}`;
        textEl.textContent    = CAPTIONS[id] || DEFAULT_CAPTION;
        prevBtn.disabled       = idx === 0;
        nextBtn.textContent    = (idx === steps.length - 1) ? 'خلصنا 🎉' : 'التالي';
    }

    function startTour() {
        steps = collectSteps();
        if (!steps.length) return;
        idx    = 0;
        active = true;
        card.hidden = false;
        requestAnimationFrame(() => card.classList.add('is-open'));
        renderStep();
    }

    function endTour() {
        active = false;
        clearGlow();
        card.classList.remove('is-open');
        setTimeout(() => { card.hidden = true; }, 220);
    }

    triggerBtn.addEventListener('click', () => {
        if (active) { endTour(); } else { startTour(); }
    });

    skipBtn.addEventListener('click', endTour);

    prevBtn.addEventListener('click', () => {
        if (idx > 0) { idx -= 1; renderStep(); }
    });

    nextBtn.addEventListener('click', () => {
        if (idx < steps.length - 1) {
            idx += 1;
            renderStep();
        } else {
            endTour();
            // ── بعد ما تخلص الجولة، اقترح دردشة حقيقية مع زعزع ──
            const toast = document.getElementById('toast');
            if (toast) {
                toast.textContent = 'جربت الجولة! 🧭 لو عايز تسأل زعزع أي حاجة تانية، دوس على أيقونة البوت.';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3200);
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!active) return;
        if (e.key === 'Escape') endTour();
        if (e.key === 'ArrowRight') prevBtn.click();
        if (e.key === 'ArrowLeft')  nextBtn.click();
    });
});
