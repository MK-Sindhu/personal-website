// "Copy email" button in the contact band. Falls back to selecting the address
// when the Clipboard API is unavailable or the write is refused.
(function () {
  var btn = document.getElementById('copy-email');
  var email = document.getElementById('email');
  var status = document.getElementById('copy-status');
  function selectEmail() {
    var range = document.createRange();
    range.selectNodeContents(email);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    status.textContent = 'Selected. Press Ctrl+C or ⌘C to copy.';
  }
  btn.addEventListener('click', function () {
    var text = email.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { status.textContent = 'Copied'; }, selectEmail);
    } else {
      selectEmail();
    }
  });
})();
