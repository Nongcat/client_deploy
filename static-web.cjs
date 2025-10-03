// C:\Users\Administrator\Documents\client_2\static-web.cjs
const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const dist = path.join(__dirname, 'dist');

// àÊÔÃì¿ä¿Åì¨Ò¡ dist (ÍÂèÒ¤×¹ index ÍÑµâ¹ÁÑµÔ)
app.use(express.static(dist, { index: false, fallthrough: true }));

// Fallback à©¾ÒÐË¹éÒ HTML à·èÒ¹Ñé¹
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const accept = req.headers.accept || '';
  // ¶éÒºÃÒÇà«ÍÃì¢ÍË¹éÒàÇçº (HTML) ¤èÍÂÊè§ index.html
  if (accept.includes('text/html')) {
    return res.sendFile(path.join(dist, 'index.html'));
  }
  // äÁèãªè HTML  »ÅèÍÂãËéä» 404 »¡µÔ (àªè¹¾ÔÁ¾ì¾Ò¸ asset ¼Ô´)
  return next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`? ppc-web2 listening on http://0.0.0.0:${PORT}`);
});
