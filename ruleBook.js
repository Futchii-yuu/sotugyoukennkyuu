const ruleBookBtn = document.getElementById('ruleBookBtn');
const ruleBook = document.getElementById('ruleBook');
// const closeBtn = document.getElementById('closeBtn');

ruleBookBtn.addEventListener('click', () => {
    if (ruleBook.style.display === 'none') {
        ruleBook.style.display = 'block';
        // closeBtn.style.display = 'flex';
    } else {
        // closeBtn.style.display = 'none';
        // runOnOptionPhp();
        ruleBook.style.display = 'none';
    }
});

// closeBtn.addEventListener('click', () => {
//     closeBtn.style.display = 'none';
//     runOnOptionPhp();
//     ruleBook.style.display = 'none';
// });

const runOnOptionPhp = () => {
    if (window.location.pathname.endsWith('option.php')) {
        if(ruleBook.style.display === 'block' && (dp.style.display === 'flex' || epp.style.display === 'flex')){
            closeBtn.style.display = 'flex';
        }else{
            epp.style.display = 'none';
            dp.style.display = 'none';
        }
    }
}