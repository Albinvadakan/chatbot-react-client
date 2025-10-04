/**
 * Utility functions to format AI responses for better readability
 */

export const formatMessage = (text) => {
  if (!text) return '';
  
  // Clean up the text first
  let formatted = text.trim();
  
  // First, let's identify numbered lists and separate them
  formatted = formatted.replace(/(\d+\.\s+[^.]+(?:\([^)]+\)[^.]*)?)(?:\s+(?=\d+\.)|\s*$)/g, '\n\n$1\n\n');
  
  // Split into paragraphs based on natural breaks
  const paragraphs = formatted.split(/\n\n+/).filter(p => p.trim());
  
  return paragraphs.map(paragraph => formatParagraph(paragraph.trim())).join('\n\n');
};

const shouldStartNewParagraph = (sentence, currentParagraph) => {
  // Start new paragraph for numbered lists
  if (/^\d+\./.test(sentence)) return true;
  
  // Start new paragraph for topics that begin with keywords
  const topicStarters = [
    'However,', 'Moreover,', 'Additionally,', 'Furthermore,', 'In contrast,',
    'On the other hand,', 'Nevertheless,', 'Therefore,', 'Consequently,',
    'As a result,', 'In conclusion,', 'To summarize,', 'In summary,'
  ];
  
  return topicStarters.some(starter => sentence.startsWith(starter)) && currentParagraph.length > 100;
};

const formatParagraph = (paragraph) => {
  let formatted = paragraph;
  
  // Check if this is a numbered list item
  if (/^\d+\.\s/.test(formatted)) {
    // Format numbered list items
    formatted = formatted.replace(/^(\d+)\.\s+(.+)$/s, (match, num, content) => {
      return `**${num}.** ${content.trim()}`;
    });
  } else {
    // Regular paragraph - add line breaks for better readability
    // Break long sentences at conjunctions for better reading
    const breakPoints = [
      ', which ', ', where ', ', and ', ', but ', ', however ', 
      '. However,', '. Moreover,', '. Additionally,', '. Furthermore,'
    ];
    
    breakPoints.forEach(breakPoint => {
      if (formatted.includes(breakPoint) && formatted.length > 200) {
        formatted = formatted.replace(breakPoint, breakPoint + '\n\n');
      }
    });
  }
  
  // Bold important medical terms and conditions
  const medicalTerms = [
    'diabetes', 'hyperglycemia', 'insulin', 'pancreas', 'glucose', 'bloodstream',
    'Type 1 diabetes', 'Type 2 diabetes', 'T1D', 'T2D', 'insulin resistance',
    'blood sugar', 'complications', 'immune system', 'metabolic disorder'
  ];
  
  medicalTerms.forEach(term => {
    const regex = new RegExp(`\\b(${term})\\b`, 'gi');
    formatted = formatted.replace(regex, (match) => `**${match}**`);
  });
  
  return formatted;
};

export const renderFormattedMessage = (text) => {
  if (!text) return '';
  
  const formatted = formatMessage(text);
  
  // Split into sections and process each
  const sections = formatted.split('\n\n').filter(section => section.trim());
  
  let html = '';
  let inList = false;
  
  sections.forEach((section, index) => {
    const trimmedSection = section.trim();
    
    // Check if this is a numbered list item
    if (/^\*\*\d+\.\*\*/.test(trimmedSection)) {
      if (!inList) {
        html += '<ol class="numbered-list">';
        inList = true;
      }
      
      const listItemContent = trimmedSection.replace(/^\*\*(\d+)\.\*\*\s*/, '');
      html += `<li>${formatInlineText(listItemContent)}</li>`;
    } else {
      // Close list if we were in one
      if (inList) {
        html += '</ol>';
        inList = false;
      }
      
      // Regular paragraph
      html += `<p>${formatInlineText(trimmedSection)}</p>`;
    }
  });
  
  // Close any open list
  if (inList) {
    html += '</ol>';
  }
  
  return html;
};

const formatInlineText = (text) => {
  return text
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Add line breaks for readability
    .replace(/\n/g, '<br>');
};