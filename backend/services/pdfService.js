const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pdfDir } = require('../config/multer');

class PDFService {
  constructor() {
    this.pdfDir = pdfDir;
  }

  async generateResumePDF(structuredData) {
    try {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      
      let page = pdfDoc.addPage([612, 792]); // Letter size
      const { width, height } = page.getSize();
      
      const margin = 50;
      const contentWidth = width - (2 * margin);
      let yPosition = height - margin;
      const lineHeight = 14;
      const sectionGap = 20;
      
      const colors = {
        primary: rgb(0.1, 0.1, 0.3),
        secondary: rgb(0.3, 0.3, 0.3),
        text: rgb(0.15, 0.15, 0.15),
        accent: rgb(0.2, 0.4, 0.6)
      };

      const addNewPageIfNeeded = (neededSpace) => {
        if (yPosition - neededSpace < margin) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - margin;
          return true;
        }
        return false;
      };

      const drawText = (text, x, y, font, size, color = colors.text) => {
        // Convert to string and handle null/undefined
        const textStr = String(text || '');
        if (!textStr.trim()) return;
        
        page.drawText(textStr, {
          x,
          y,
          size,
          font,
          color
        });
      };

      const wrapText = (text, maxWidth, font, size) => {
        // Convert to string and handle null/undefined
        const textStr = String(text || '');
        if (!textStr.trim()) return [];
        
        const words = textStr.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = font.widthOfTextAtSize(testLine, size);
          
          if (testWidth < maxWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      const { personalInfo, summary, skills, experience, projects, education, certifications } = structuredData;

      if (personalInfo.name) {
        const nameStr = String(personalInfo.name).toUpperCase();
        drawText(nameStr, margin, yPosition, timesRomanBoldFont, 24, colors.primary);
        yPosition -= 30;
      }

      const contactParts = [];
      if (personalInfo.email) contactParts.push(String(personalInfo.email));
      if (personalInfo.phone) contactParts.push(String(personalInfo.phone));
      if (personalInfo.location) contactParts.push(String(personalInfo.location));
      
      if (contactParts.length > 0) {
        drawText(contactParts.join(' | '), margin, yPosition, timesRomanFont, 10, colors.secondary);
        yPosition -= 15;
      }

      const linkParts = [];
      if (personalInfo.linkedin) linkParts.push(`LinkedIn: ${String(personalInfo.linkedin)}`);
      if (personalInfo.github) linkParts.push(`GitHub: ${String(personalInfo.github)}`);
      if (personalInfo.portfolio) linkParts.push(`Portfolio: ${String(personalInfo.portfolio)}`);
      
      if (linkParts.length > 0) {
        const linksText = linkParts.join(' | ');
        const linkLines = wrapText(linksText, contentWidth, timesRomanFont, 9);
        for (const line of linkLines) {
          drawText(line, margin, yPosition, timesRomanFont, 9, colors.accent);
          yPosition -= 12;
        }
      }

      yPosition -= 10;
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 1,
        color: colors.accent
      });
      yPosition -= sectionGap;

      if (summary) {
        addNewPageIfNeeded(60);
        drawText('PROFESSIONAL SUMMARY', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        const summaryLines = wrapText(summary, contentWidth, timesRomanFont, 10);
        for (const line of summaryLines) {
          addNewPageIfNeeded(lineHeight);
          drawText(line, margin, yPosition, timesRomanFont, 10);
          yPosition -= lineHeight;
        }
        yPosition -= sectionGap;
      }

      if (skills && skills.length > 0) {
        addNewPageIfNeeded(40);
        drawText('SKILLS', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        const skillsText = skills.filter(s => s && String(s).trim()).join(' • ');
        if (skillsText) {
          const skillLines = wrapText(skillsText, contentWidth, timesRomanFont, 10);
          for (const line of skillLines) {
            addNewPageIfNeeded(lineHeight);
            drawText(line, margin, yPosition, timesRomanFont, 10);
            yPosition -= lineHeight;
          }
        }
        yPosition -= sectionGap;
      }

      if (experience && experience.length > 0) {
        addNewPageIfNeeded(40);
        drawText('EXPERIENCE', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        for (const exp of experience) {
          addNewPageIfNeeded(60);
          
          const title = String(exp.title || 'Position');
          const company = exp.company ? String(exp.company) : '';
          const startDate = String(exp.startDate || '');
          const endDate = exp.current ? 'Present' : String(exp.endDate || '');
          const dateRange = `${startDate}${startDate && endDate ? ' - ' : ''}${endDate}`;
          
          drawText(title, margin, yPosition, timesRomanBoldFont, 11, colors.text);
          yPosition -= 14;
          
          if (company) {
            const location = exp.location ? ` | ${String(exp.location)}` : '';
            drawText(`${company}${location} | ${dateRange}`, margin, yPosition, timesRomanFont, 10, colors.secondary);
            yPosition -= 14;
          }
          
          if (exp.description) {
            const descLines = wrapText(exp.description, contentWidth - 10, timesRomanFont, 10);
            for (const line of descLines) {
              addNewPageIfNeeded(lineHeight);
              drawText(line, margin + 10, yPosition, timesRomanFont, 10);
              yPosition -= lineHeight;
            }
          }
          
          if (exp.highlights && exp.highlights.length > 0) {
            for (const highlight of exp.highlights) {
              addNewPageIfNeeded(lineHeight);
              const highlightLines = wrapText(`• ${highlight}`, contentWidth - 20, timesRomanFont, 10);
              for (const line of highlightLines) {
                addNewPageIfNeeded(lineHeight);
                drawText(line, margin + 15, yPosition, timesRomanFont, 10);
                yPosition -= lineHeight;
              }
            }
          }
          yPosition -= 10;
        }
        yPosition -= 10;
      }

      if (projects && projects.length > 0) {
        addNewPageIfNeeded(40);
        drawText('PROJECTS', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        for (const project of projects) {
          addNewPageIfNeeded(50);
          
          const projectName = String(project.name || 'Project');
          drawText(projectName, margin, yPosition, timesRomanBoldFont, 11, colors.text);
          yPosition -= 14;
          
          if (project.technologies && project.technologies.length > 0) {
            const techStr = project.technologies.filter(t => t).join(', ');
            if (techStr) {
              drawText(`Technologies: ${techStr}`, margin + 10, yPosition, timesRomanFont, 9, colors.secondary);
              yPosition -= 12;
            }
          }
          
          if (project.description) {
            const descLines = wrapText(project.description, contentWidth - 10, timesRomanFont, 10);
            for (const line of descLines) {
              addNewPageIfNeeded(lineHeight);
              drawText(line, margin + 10, yPosition, timesRomanFont, 10);
              yPosition -= lineHeight;
            }
          }
          
          if (project.url || project.github) {
            const links = [];
            if (project.url) links.push(`URL: ${String(project.url)}`);
            if (project.github) links.push(`GitHub: ${String(project.github)}`);
            drawText(links.join(' | '), margin + 10, yPosition, timesRomanFont, 9, colors.accent);
            yPosition -= 12;
          }
          yPosition -= 8;
        }
        yPosition -= 10;
      }

      if (education && education.length > 0) {
        addNewPageIfNeeded(40);
        drawText('EDUCATION', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        for (const edu of education) {
          addNewPageIfNeeded(40);
          
          const degreeStr = edu.degree ? String(edu.degree) : '';
          const fieldStr = edu.field ? String(edu.field) : '';
          const degree = degreeStr 
            ? `${degreeStr}${fieldStr ? ` in ${fieldStr}` : ''}` 
            : fieldStr || 'Degree';
          drawText(degree, margin, yPosition, timesRomanBoldFont, 11, colors.text);
          yPosition -= 14;
          
          if (edu.institution) {
            const institutionInfo = [];
            institutionInfo.push(String(edu.institution));
            if (edu.location) institutionInfo.push(String(edu.location));
            if (edu.startDate || edu.endDate) {
              institutionInfo.push(`${edu.startDate || ''} - ${edu.endDate || ''}`);
            }
            if (edu.gpa) institutionInfo.push(`GPA: ${String(edu.gpa)}`);
            
            drawText(institutionInfo.join(' | '), margin, yPosition, timesRomanFont, 10, colors.secondary);
            yPosition -= 14;
          }
          yPosition -= 6;
        }
        yPosition -= 10;
      }

      if (certifications && certifications.length > 0) {
        addNewPageIfNeeded(40);
        drawText('CERTIFICATIONS', margin, yPosition, timesRomanBoldFont, 12, colors.primary);
        yPosition -= 18;
        
        for (const cert of certifications) {
          addNewPageIfNeeded(20);
          
          const certName = String(cert.name || 'Certification');
          const certIssuer = cert.issuer ? ` - ${String(cert.issuer)}` : '';
          const certDate = cert.date ? ` (${String(cert.date)})` : '';
          const certText = `${certName}${certIssuer}${certDate}`;
          drawText(`• ${certText}`, margin, yPosition, timesRomanFont, 10);
          yPosition -= lineHeight;
        }
      }

      const pdfBytes = await pdfDoc.save();
      const fileName = `resume_${uuidv4()}.pdf`;
      const filePath = path.join(this.pdfDir, fileName);
      
      await fs.writeFile(filePath, pdfBytes);
      
      return {
        fileName,
        filePath,
        relativePath: `/uploads/generated/${fileName}`
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF: ' + error.message);
    }
  }

  async parseResumePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF: ' + error.message);
    }
  }

  async deletePDF(filePath) {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.warn('Failed to delete PDF:', error.message);
      return false;
    }
  }
}

module.exports = new PDFService();
