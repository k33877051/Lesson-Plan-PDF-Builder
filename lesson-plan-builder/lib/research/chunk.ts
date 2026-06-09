// Content Chunking Module
// Splits content into semantic chunks for RAG (Retrieval Augmented Generation)

export interface ContentChunk {
  id: string;
  content: string;
  summary?: string;
  startIndex: number;
  endIndex: number;
  metadata: {
    sourceUrl: string;
    position: number; // Position in document (1st, 2nd, etc.)
    wordCount: number;
    hasObjectives?: boolean;
    hasActivities?: boolean;
    hasAssessment?: boolean;
  };
}

// Split content into semantic chunks
export function chunkContent(
  content: string,
  sourceUrl: string,
  maxChunkSize: number = 1000, // ~1000 characters per chunk
  overlap: number = 200 // ~200 character overlap between chunks
): ContentChunk[] {
  const chunks: ContentChunk[] = [];

  // Clean content
  const cleaned = content.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= maxChunkSize) {
    // Content fits in single chunk
    chunks.push(createChunk(cleaned, sourceUrl, 0, cleaned.length, 1));
    return chunks;
  }

  // Split by paragraphs first
  const paragraphs = cleaned.split(/\n\n+/);

  let currentChunk = '';
  let chunkStart = 0;
  let chunkPosition = 1;

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length <= maxChunkSize) {
      // Add to current chunk
      if (currentChunk) {
        currentChunk += '\n\n';
      }
      currentChunk += paragraph;
    } else {
      // Save current chunk if it has content
      if (currentChunk.length >= 200) {
        chunks.push(
          createChunk(
            currentChunk,
            sourceUrl,
            chunkStart,
            chunkStart + currentChunk.length,
            chunkPosition++
          )
        );

        // Start new chunk with overlap
        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + '\n\n' + paragraph;
        chunkStart += currentChunk.length - overlapText.length;
      } else {
        // Chunk too small, add anyway and start fresh
        chunks.push(
          createChunk(
            currentChunk || paragraph,
            sourceUrl,
            chunkStart,
            chunkStart + (currentChunk || paragraph).length,
            chunkPosition++
          )
        );
        currentChunk = paragraph;
        chunkStart += currentChunk.length;
      }
    }
  }

  // Add final chunk
  if (currentChunk.length >= 100) {
    chunks.push(
      createChunk(
        currentChunk,
        sourceUrl,
        chunkStart,
        chunkStart + currentChunk.length,
        chunkPosition
      )
    );
  }

  return chunks;
}

// Create a chunk object
function createChunk(
  content: string,
  sourceUrl: string,
  startIndex: number,
  endIndex: number,
  position: number
): ContentChunk {
  const lowerContent = content.toLowerCase();

  return {
    id: `${sourceUrl}-${position}`,
    content,
    summary: generateChunkSummary(content),
    startIndex,
    endIndex,
    metadata: {
      sourceUrl,
      position,
      wordCount: countWords(content),
      hasObjectives: /objective|วัตถุประสงค์/i.test(lowerContent),
      hasActivities: /activity|กิจกรรม/i.test(lowerContent),
      hasAssessment: /assess|evaluate|ประเมิน/i.test(lowerContent),
    },
  };
}

// Get overlap text for chunk boundary
function getOverlapText(text: string, overlapSize: number): string {
  // Try to end at sentence boundary
  const end = text.slice(-overlapSize);
  const lastSentence = end.match(/[.!?][^.!?]*$/);

  if (lastSentence) {
    return lastSentence[0].slice(1).trim();
  }

  // Fallback: just take last N characters
  return text.slice(-overlapSize).trim();
}

// Count words (Thai + English support)
function countWords(text: string): number {
  const thaiWords = text.match(/[\u0E00-\u0E7F]+/g) || [];
  const englishWords = text.match(/\b[a-zA-Z]+\b/g) || [];
  return thaiWords.length + englishWords.length;
}

// Generate a summary for a chunk
function generateChunkSummary(content: string, maxLength: number = 200): string {
  // Extract first sentence or first N characters
  const firstSentence = content.match(/^[^.!?]+[.!?]/);

  if (firstSentence) {
    const sentence = firstSentence[0].trim();
    if (sentence.length <= maxLength) {
      return sentence;
    }
  }

  return content.slice(0, maxLength).trim() + '...';
}

// Chunk by educational sections (objectives, activities, assessment)
export function chunkBySections(
  content: string,
  sourceUrl: string
): ContentChunk[] {
  const sections: ContentChunk[] = [];

  // Define section patterns
  const sectionPatterns = [
    {
      name: 'objectives',
      patterns: [
        /(?:^|\n)\s*(?:วัตถุประสงค์|จุดประสงค์|objectives?)[\s:]+/i,
        /(?:^|\n)\s*\d+[.)\s]+(?:วัตถุประสงค์|objective)/i,
      ],
    },
    {
      name: 'activities',
      patterns: [
        /(?:^|\n)\s*(?:กิจกรรม|activities?|learning activities?)[\s:]+/i,
        /(?:^|\n)\s*\d+[.)\s]+(?:กิจกรรม|activity|procedure)/i,
      ],
    },
    {
      name: 'assessment',
      patterns: [
        /(?:^|\n)\s*(?:การประเมิน|assessment|evaluation|measur)[\s:]+/i,
        /(?:^|\n)\s*\d+[.)\s]+(?:การประเมิน|assess|evaluate)/i,
      ],
    },
    {
      name: 'content',
      patterns: [
        /(?:^|\n)\s*(?:เนื้อหา|content|material)[\s:]+/i,
      ],
    },
  ];

  let lastIndex = 0;
  let sectionIndex = 0;

  for (const section of sectionPatterns) {
    for (const pattern of section.patterns) {
      const match = content.slice(lastIndex).match(pattern);
      if (match && match.index !== undefined) {
        const startPos = lastIndex + match.index;

        // Find the end of this section (start of next pattern or double newline)
        const rest = content.slice(startPos + match[0].length);
        const nextSection = rest.match(
          /(?:\n\s*\n|\n\s*(?:วัตถุประสงค์|กิจกรรม|การประเมิน|เนื้อหา|objective|activity|assess|content)[\s:]+)/i
        );

        const endPos = nextSection
          ? startPos + match[0].length + nextSection.index!
          : content.length;

        const sectionContent = content.slice(startPos, endPos).trim();

        if (sectionContent.length > 50) {
          sections.push({
            id: `${sourceUrl}-${section.name}-${sectionIndex++}`,
            content: sectionContent,
            summary: `${section.name}: ${sectionContent.slice(0, 100)}...`,
            startIndex: startPos,
            endIndex: endPos,
            metadata: {
              sourceUrl,
              position: sections.length + 1,
              wordCount: countWords(sectionContent),
              hasObjectives: section.name === 'objectives',
              hasActivities: section.name === 'activities',
              hasAssessment: section.name === 'assessment',
            },
          });
        }

        lastIndex = endPos;
        break;
      }
    }
  }

  // If no sections found, use regular chunking
  if (sections.length === 0) {
    return chunkContent(content, sourceUrl);
  }

  return sections;
}

// Select most relevant chunks for a query
export function selectRelevantChunks(
  chunks: ContentChunk[],
  query: string,
  maxChunks: number = 5
): ContentChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/);

  // Score each chunk
  const scoredChunks = chunks.map((chunk) => {
    const chunkText = chunk.content.toLowerCase();
    let score = 0;

    // Word overlap score
    for (const word of queryWords) {
      if (word.length > 2) {
        const matches = (chunkText.match(new RegExp(word, 'g')) || []).length;
        score += matches * 2;
      }
    }

    // Boost for lesson plan structure
    if (chunk.metadata.hasObjectives) score += 5;
    if (chunk.metadata.hasActivities) score += 5;
    if (chunk.metadata.hasAssessment) score += 5;

    // Boost for appropriate length
    if (chunk.metadata.wordCount > 50 && chunk.metadata.wordCount < 500) {
      score += 3;
    }

    return { chunk, score };
  });

  // Sort by score and return top N
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, maxChunks).map((sc) => sc.chunk);
}

// Prepare chunks for LLM context (join with separators)
export function formatChunksForContext(chunks: ContentChunk[]): string {
  return chunks
    .map(
      (chunk, index) =>
        `[Source ${index + 1}]\n${chunk.content}\n---\n${
          chunk.metadata.hasObjectives ? 'Contains objectives. ' : ''
        }${chunk.metadata.hasActivities ? 'Contains activities. ' : ''}${
          chunk.metadata.hasAssessment ? 'Contains assessment.' : ''
        }\n`.trim()
    )
    .join('\n\n');
}
