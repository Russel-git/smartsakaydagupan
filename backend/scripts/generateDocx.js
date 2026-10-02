const HTMLtoDOCX = require('html-to-docx');
const fs = require('fs');
const path = require('path');

async function generateDocx() {
  try {
    const htmlPath = path.join(__dirname, '../../docs/CHECKPOINT_02_REPORT.html');
    const docxPath = path.join(__dirname, '../../docs/CHECKPOINT_02_DEPLOYING_AND_SECURING_MERN.docx');

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
      title: 'Checkpoint 02: Deploying and Securing a MERN Application',
    });

    fs.writeFileSync(docxPath, fileBuffer);
    console.log(`Successfully generated DOCX at: ${docxPath}`);
  } catch (error) {
    console.error('Error generating DOCX:', error);
    process.exit(1);
  }
}

generateDocx();
