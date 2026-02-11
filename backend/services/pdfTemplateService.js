const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { pdfDir } = require('../config/multer');

// Sanitize text to remove Unicode characters not supported by WinAnsi encoding
const sanitizeText = (text) => {
  if (!text) return '';
  return String(text)
    // Replace common Unicode characters with ASCII equivalents
    .replace(/[\u2018\u2019]/g, "'")  // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"')  // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-')  // En dash, em dash
    .replace(/\u2026/g, '...')         // Ellipsis
    .replace(/[\u25B8\u25B9\u25BA]/g, '>')  // Triangular bullets
    .replace(/[\u25CF\u25CB\u25A0]/g, '*')  // Circle and square bullets
    .replace(/[\u2022\u2023\u2043]/g, '*')  // Other bullets
    .replace(/[\u00A0]/g, ' ')         // Non-breaking space
    .replace(/[\u2192\u2190\u2191\u2193]/g, '->')  // Arrows
    // Remove any remaining characters outside WinAnsi range (0x20-0xFF except 0x7F-0x9F)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
};

// Template configurations
const TEMPLATES = {
  modern: {
    name: 'Modern',
    colors: {
      primary: rgb(0.04, 0.52, 0.89),    // Blue
      secondary: rgb(0.4, 0.4, 0.4),
      text: rgb(0.1, 0.1, 0.1),
      accent: rgb(0.04, 0.52, 0.89),
      background: rgb(1, 1, 1),
      headerBg: rgb(0.04, 0.52, 0.89)
    },
    fonts: {
      header: StandardFonts.HelveticaBold,
      body: StandardFonts.Helvetica,
      accent: StandardFonts.HelveticaOblique
    },
    layout: {
      headerStyle: 'colored-bar',
      sectionStyle: 'underlined',
      bulletStyle: '●'
    }
  },
  classic: {
    name: 'Classic',
    colors: {
      primary: rgb(0.1, 0.1, 0.3),
      secondary: rgb(0.3, 0.3, 0.3),
      text: rgb(0.15, 0.15, 0.15),
      accent: rgb(0.2, 0.4, 0.6),
      background: rgb(1, 1, 1),
      headerBg: rgb(1, 1, 1)
    },
    fonts: {
      header: StandardFonts.TimesRomanBold,
      body: StandardFonts.TimesRoman,
      accent: StandardFonts.TimesRomanItalic
    },
    layout: {
      headerStyle: 'centered',
      sectionStyle: 'bold',
      bulletStyle: '•'
    }
  },
  minimal: {
    name: 'Minimal',
    colors: {
      primary: rgb(0, 0, 0),
      secondary: rgb(0.5, 0.5, 0.5),
      text: rgb(0.2, 0.2, 0.2),
      accent: rgb(0.3, 0.3, 0.3),
      background: rgb(1, 1, 1),
      headerBg: rgb(1, 1, 1)
    },
    fonts: {
      header: StandardFonts.HelveticaBold,
      body: StandardFonts.Helvetica,
      accent: StandardFonts.Helvetica
    },
    layout: {
      headerStyle: 'left-aligned',
      sectionStyle: 'simple',
      bulletStyle: '-'
    }
  },
  creative: {
    name: 'Creative',
    colors: {
      primary: rgb(0.56, 0.27, 0.68),    // Purple
      secondary: rgb(0.4, 0.4, 0.45),
      text: rgb(0.2, 0.2, 0.25),
      accent: rgb(0.93, 0.46, 0.19),     // Orange accent
      background: rgb(1, 1, 1),
      headerBg: rgb(0.56, 0.27, 0.68)
    },
    fonts: {
      header: StandardFonts.HelveticaBold,
      body: StandardFonts.Helvetica,
      accent: StandardFonts.HelveticaOblique
    },
    layout: {
      headerStyle: 'sidebar',
      sectionStyle: 'colored',
      bulletStyle: '▸'
    }
  },
  professional: {
    name: 'Professional',
    colors: {
      primary: rgb(0.13, 0.27, 0.42),    // Dark blue
      secondary: rgb(0.35, 0.35, 0.35),
      text: rgb(0.15, 0.15, 0.15),
      accent: rgb(0.18, 0.55, 0.34),     // Green accent
      background: rgb(1, 1, 1),
      headerBg: rgb(0.13, 0.27, 0.42)
    },
    fonts: {
      header: StandardFonts.TimesRomanBold,
      body: StandardFonts.TimesRoman,
      accent: StandardFonts.TimesRomanItalic
    },
    layout: {
      headerStyle: 'two-column',
      sectionStyle: 'boxed',
      bulletStyle: '■'
    }
  }
};

class PDFTemplateService {
  constructor() {
    this.pdfDir = pdfDir;
    this.templates = TEMPLATES;
  }

  getTemplates() {
    return Object.entries(TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      preview: `/templates/${id}-preview.png`
    }));
  }

  async generateResumePDF(structuredData, templateId = 'modern', customStyles = {}) {
    try {
      const template = TEMPLATES[templateId] || TEMPLATES.modern;
      
      // Apply custom style overrides
      const colors = { ...template.colors };
      if (customStyles.primaryColor) {
        colors.primary = this.hexToRgb(customStyles.primaryColor);
        colors.headerBg = this.hexToRgb(customStyles.primaryColor);
        colors.accent = this.hexToRgb(customStyles.primaryColor);
      }
      if (customStyles.accentColor) {
        colors.accent = this.hexToRgb(customStyles.accentColor);
      }

      const pdfDoc = await PDFDocument.create();
      const fonts = {
        header: await pdfDoc.embedFont(template.fonts.header),
        body: await pdfDoc.embedFont(template.fonts.body),
        accent: await pdfDoc.embedFont(template.fonts.accent)
      };

      let page = pdfDoc.addPage([612, 792]);
      const { width, height } = page.getSize();
      const margin = 50;
      const contentWidth = width - (2 * margin);
      let yPosition = height - margin;
      const lineHeight = customStyles.lineSpacing || 14;
      const sectionGap = 20;

      // Helper functions
      const addNewPageIfNeeded = (neededSpace) => {
        if (yPosition - neededSpace < margin) {
          page = pdfDoc.addPage([612, 792]);
          yPosition = height - margin;
          return true;
        }
        return false;
      };

      const drawText = (text, x, y, font, size, color = colors.text) => {
        const textStr = sanitizeText(text);
        if (!textStr.trim()) return;
        page.drawText(textStr, { x, y, size, font, color });
      };

      const wrapText = (text, maxWidth, font, size) => {
        const textStr = sanitizeText(text);
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

      const drawSectionHeader = (title) => {
        addNewPageIfNeeded(40);
        const layout = template.layout;
        
        if (layout.sectionStyle === 'underlined') {
          drawText(title.toUpperCase(), margin, yPosition, fonts.header, 12, colors.primary);
          yPosition -= 4;
          page.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: margin + contentWidth, y: yPosition },
            thickness: 1,
            color: colors.primary
          });
          yPosition -= 14;
        } else if (layout.sectionStyle === 'colored') {
          page.drawRectangle({
            x: margin - 5,
            y: yPosition - 5,
            width: contentWidth + 10,
            height: 20,
            color: rgb(colors.primary.red * 0.1, colors.primary.green * 0.1, colors.primary.blue * 0.1)
          });
          drawText(title.toUpperCase(), margin, yPosition, fonts.header, 12, colors.primary);
          yPosition -= 22;
        } else if (layout.sectionStyle === 'boxed') {
          page.drawRectangle({
            x: margin - 5,
            y: yPosition - 5,
            width: contentWidth + 10,
            height: 20,
            borderColor: colors.primary,
            borderWidth: 1
          });
          drawText(title.toUpperCase(), margin + 5, yPosition, fonts.header, 11, colors.primary);
          yPosition -= 22;
        } else {
          drawText(title.toUpperCase(), margin, yPosition, fonts.header, 12, colors.primary);
          yPosition -= 18;
        }
      };

      // Extract data
      const { personalInfo = {}, summary, skills = [], experience = [], projects = [], education = [], certifications = [] } = structuredData;

      // Draw header based on template style
      const layoutStyle = template.layout.headerStyle;
      
      if (layoutStyle === 'colored-bar') {
        page.drawRectangle({
          x: 0, y: height - 90, width, height: 90,
          color: colors.headerBg
        });
        if (personalInfo.name) {
          drawText(String(personalInfo.name).toUpperCase(), margin, height - 50, fonts.header, 26, rgb(1, 1, 1));
        }
        const contactParts = [];
        if (personalInfo.email) contactParts.push(String(personalInfo.email));
        if (personalInfo.phone) contactParts.push(String(personalInfo.phone));
        if (personalInfo.location) contactParts.push(String(personalInfo.location));
        if (contactParts.length > 0) {
          drawText(contactParts.join(' | '), margin, height - 72, fonts.body, 10, rgb(0.9, 0.9, 0.9));
        }
        yPosition = height - 110;
      } else if (layoutStyle === 'centered') {
        if (personalInfo.name) {
          const sanitizedName = sanitizeText(String(personalInfo.name).toUpperCase());
          const nameWidth = fonts.header.widthOfTextAtSize(sanitizedName, 24);
          drawText(sanitizedName, (width - nameWidth) / 2, yPosition, fonts.header, 24, colors.primary);
          yPosition -= 30;
        }
        const contactParts = [];
        if (personalInfo.email) contactParts.push(String(personalInfo.email));
        if (personalInfo.phone) contactParts.push(String(personalInfo.phone));
        if (personalInfo.location) contactParts.push(String(personalInfo.location));
        if (contactParts.length > 0) {
          const contactText = sanitizeText(contactParts.join(' | '));
          const contactWidth = fonts.body.widthOfTextAtSize(contactText, 10);
          drawText(contactText, (width - contactWidth) / 2, yPosition, fonts.body, 10, colors.secondary);
          yPosition -= 20;
        }
      } else {
        // Left-aligned (default)
        if (personalInfo.name) {
          drawText(String(personalInfo.name).toUpperCase(), margin, yPosition, fonts.header, 24, colors.primary);
          yPosition -= 30;
        }
        const contactParts = [];
        if (personalInfo.email) contactParts.push(String(personalInfo.email));
        if (personalInfo.phone) contactParts.push(String(personalInfo.phone));
        if (personalInfo.location) contactParts.push(String(personalInfo.location));
        if (contactParts.length > 0) {
          drawText(contactParts.join(' | '), margin, yPosition, fonts.body, 10, colors.secondary);
          yPosition -= 15;
        }
      }

      // Links row
      const linkParts = [];
      if (personalInfo.linkedin) linkParts.push(`LinkedIn: ${String(personalInfo.linkedin)}`);
      if (personalInfo.github) linkParts.push(`GitHub: ${String(personalInfo.github)}`);
      if (personalInfo.portfolio) linkParts.push(`Portfolio: ${String(personalInfo.portfolio)}`);
      if (linkParts.length > 0) {
        const linksText = linkParts.join(' | ');
        const linkLines = wrapText(linksText, contentWidth, fonts.body, 9);
        for (const line of linkLines) {
          drawText(line, margin, yPosition, fonts.body, 9, colors.accent);
          yPosition -= 12;
        }
      }

      // Divider
      page.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: width - margin, y: yPosition },
        thickness: 1,
        color: colors.accent
      });
      yPosition -= sectionGap;

      // Summary
      if (summary) {
        drawSectionHeader('Professional Summary');
        const summaryLines = wrapText(summary, contentWidth, fonts.body, 10);
        for (const line of summaryLines) {
          addNewPageIfNeeded(lineHeight);
          drawText(line, margin, yPosition, fonts.body, 10);
          yPosition -= lineHeight;
        }
        yPosition -= sectionGap;
      }

      // Skills
      if (skills && skills.length > 0) {
        drawSectionHeader('Skills');
        const skillsText = skills.filter(s => s && String(s).trim()).join(` ${template.layout.bulletStyle} `);
        if (skillsText) {
          const skillLines = wrapText(skillsText, contentWidth, fonts.body, 10);
          for (const line of skillLines) {
            addNewPageIfNeeded(lineHeight);
            drawText(line, margin, yPosition, fonts.body, 10);
            yPosition -= lineHeight;
          }
        }
        yPosition -= sectionGap;
      }

      // Experience
      if (experience && experience.length > 0) {
        drawSectionHeader('Experience');
        for (const exp of experience) {
          addNewPageIfNeeded(60);
          const title = String(exp.title || 'Position');
          const company = exp.company ? String(exp.company) : '';
          const startDate = String(exp.startDate || '');
          const endDate = exp.current ? 'Present' : String(exp.endDate || '');
          const dateRange = `${startDate}${startDate && endDate ? ' - ' : ''}${endDate}`;

          drawText(title, margin, yPosition, fonts.header, 11, colors.text);
          yPosition -= 14;

          if (company) {
            const location = exp.location ? ` | ${String(exp.location)}` : '';
            drawText(`${company}${location} | ${dateRange}`, margin, yPosition, fonts.body, 10, colors.secondary);
            yPosition -= 14;
          }

          if (exp.description) {
            const descLines = wrapText(exp.description, contentWidth - 10, fonts.body, 10);
            for (const line of descLines) {
              addNewPageIfNeeded(lineHeight);
              drawText(line, margin + 10, yPosition, fonts.body, 10);
              yPosition -= lineHeight;
            }
          }

          if (exp.highlights && exp.highlights.length > 0) {
            for (const highlight of exp.highlights) {
              if (!highlight) continue;
              addNewPageIfNeeded(lineHeight);
              const highlightLines = wrapText(`${template.layout.bulletStyle} ${String(highlight)}`, contentWidth - 20, fonts.body, 10);
              for (const line of highlightLines) {
                addNewPageIfNeeded(lineHeight);
                drawText(line, margin + 15, yPosition, fonts.body, 10);
                yPosition -= lineHeight;
              }
            }
          }
          yPosition -= 10;
        }
        yPosition -= 10;
      }

      // Projects
      if (projects && projects.length > 0) {
        drawSectionHeader('Projects');
        for (const project of projects) {
          addNewPageIfNeeded(50);
          const projectName = String(project.name || 'Project');
          drawText(projectName, margin, yPosition, fonts.header, 11, colors.text);
          yPosition -= 14;

          if (project.technologies && project.technologies.length > 0) {
            const techStr = project.technologies.filter(t => t).join(', ');
            if (techStr) {
              drawText(`Technologies: ${techStr}`, margin + 10, yPosition, fonts.accent, 9, colors.secondary);
              yPosition -= 12;
            }
          }

          if (project.description) {
            const descLines = wrapText(project.description, contentWidth - 10, fonts.body, 10);
            for (const line of descLines) {
              addNewPageIfNeeded(lineHeight);
              drawText(line, margin + 10, yPosition, fonts.body, 10);
              yPosition -= lineHeight;
            }
          }

          if (project.url || project.github) {
            const links = [];
            if (project.url) links.push(`URL: ${String(project.url)}`);
            if (project.github) links.push(`GitHub: ${String(project.github)}`);
            drawText(links.join(' | '), margin + 10, yPosition, fonts.body, 9, colors.accent);
            yPosition -= 12;
          }
          yPosition -= 8;
        }
        yPosition -= 10;
      }

      // Education
      if (education && education.length > 0) {
        drawSectionHeader('Education');
        for (const edu of education) {
          addNewPageIfNeeded(40);
          const degreeStr = edu.degree ? String(edu.degree) : '';
          const fieldStr = edu.field ? String(edu.field) : '';
          const degree = degreeStr ? `${degreeStr}${fieldStr ? ` in ${fieldStr}` : ''}` : fieldStr || 'Degree';
          drawText(degree, margin, yPosition, fonts.header, 11, colors.text);
          yPosition -= 14;

          if (edu.institution) {
            const institutionInfo = [String(edu.institution)];
            if (edu.location) institutionInfo.push(String(edu.location));
            if (edu.startDate || edu.endDate) {
              institutionInfo.push(`${edu.startDate || ''} - ${edu.endDate || ''}`);
            }
            if (edu.gpa) institutionInfo.push(`GPA: ${String(edu.gpa)}`);
            drawText(institutionInfo.join(' | '), margin, yPosition, fonts.body, 10, colors.secondary);
            yPosition -= 14;
          }
          yPosition -= 6;
        }
        yPosition -= 10;
      }

      // Certifications
      if (certifications && certifications.length > 0) {
        drawSectionHeader('Certifications');
        for (const cert of certifications) {
          addNewPageIfNeeded(20);
          const certName = String(cert.name || 'Certification');
          const certIssuer = cert.issuer ? ` - ${String(cert.issuer)}` : '';
          const certDate = cert.date ? ` (${String(cert.date)})` : '';
          drawText(`${template.layout.bulletStyle} ${certName}${certIssuer}${certDate}`, margin, yPosition, fonts.body, 10);
          yPosition -= lineHeight;
        }
      }

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const filename = `resume_${uuidv4()}.pdf`;
      const filepath = path.join(this.pdfDir, filename);
      await fs.writeFile(filepath, pdfBytes);
      
      const relativeUrl = `/uploads/generated/${filename}`;

      return {
        filename,
        filepath,
        url: relativeUrl,
        relativePath: relativeUrl  // Alias for compatibility
      };
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return rgb(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      );
    }
    return rgb(0.1, 0.1, 0.3); // Default
  }

  async parseResumePDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info
      };
    } catch (error) {
      console.error('PDF parse error:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }
}

module.exports = new PDFTemplateService();
module.exports.TEMPLATES = TEMPLATES;
