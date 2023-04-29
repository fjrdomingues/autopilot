const { chunkSummaries } = require('./summaries');

const testCases = [  
  {    
    name: 'Chunks summaries into two parts with max length of 10',    
    summaries: 'Example summary 1\n---\nExample summary 2\n---\nExample summary 3\n---\nExample summary 4',    
    maxChunkLength: 10,    
    expected: [      
      { summary: 'Example summary 1\n---\nExample summary 2' },      
      { summary: 'Example summary 3\n---\nExample summary 4' },    
    ],
  },
  {
    name: 'Chunks a single summary with max length of 20',
    summaries: 'This is a summary\n---\nThis is another summary',
    maxChunkLength: 20,
    expected: [{ summary: 'This is a summary\n---\nThis is another summary' }],
  },
  {
    name: 'Chunks summaries into multiple parts with max length of 6',
    summaries: 'Summary 1\n---\nSummary 2\n---\nSummary 3',
    maxChunkLength: 6,
    expected: [
      { summary: 'Summary 1' },
      { summary: 'Summary 2' },
      { summary: 'Summary 3' },
    ],
  },
];

testCases.forEach(({ name, summaries, maxChunkLength, expected }) => {
  const result = chunkSummaries(summaries, maxChunkLength);

  test(name, () => {
    expect(result.length).toBe(expected.length);

    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(expected[i].summary);
    }
  });
});
