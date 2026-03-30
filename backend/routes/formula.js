const express = require('express');
const { evaluate, parse, simplify } = require('mathjs');
const katex = require('katex');

const router = express.Router();

// Middleware to parse JSON with large limits
router.use(express.json({ limit: '10mb' }));

// POST /api/formula/eval - Evaluate math formula
router.post('/eval', (req, res) => {
  try {
    const { formula, variables = {}, safe = true } = req.body;

    if (!formula || typeof formula !== 'string') {
      return res.status(400).json({ status: 'error', message: 'Formula is required' });
    }

    // Safe evaluation with mathjs (sandboxed)
    let result;
    let latex = `$${formula}$`;
    let explanation = '';

    try {
      // Parse and evaluate safely
      const node = parse(formula);
      result = evaluate(node, variables);

      // Simplify if algebraic
      const simplified = simplify(node).toTex();
      latex = `$$${simplified}$$`;

      explanation = `Kết quả: ${result.toString()}. Đơn giản hóa: ${simplified}`;
    } catch (evalErr) {
      // Fallback: try basic eval or return LaTeX only
      result = 'Cannot evaluate numerically';
      explanation = 'Công thức hợp lệ LaTeX nhưng không thể tính số. Sử dụng trong Markdown.';
    }

    res.json({
      status: 'success',
      data: {
        formula,
        result,
        latex,
        explanation,
        renderedHtml: katex.renderToString(latex, { throwOnError: false, displayMode: true })
      }
    });
  } catch (error) {
    console.error('Formula eval error:', error);
    res.status(500).json({ status: 'error', message: 'Evaluation failed' });
  }
});

// POST /api/formula/parse - Extract formulas from text
router.post('/parse', (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ status: 'error', message: 'Text required' });

    // Regex for LaTeX/math: $...$, $$...$$, \(...\)
    const latexRegex = /\$(\$?)([^$]+)\1/g;
    const formulas = [];
    let lastIndex = 0;
    let match;

    while ((match = latexRegex.exec(text)) !== null) {
      formulas.push({
        latex: match[0],
        inline: match[1].length === 1,
        content: match[2].trim()
      });
      lastIndex = match.index + match[0].length;
    }

    const plainText = text.slice(0, lastIndex).replace(latexRegex, '[FORMULA]').concat(text.slice(lastIndex));

    res.json({
      status: 'success',
      data: {
        formulas,
        count: formulas.length,
        plainText
      }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Parse failed' });
  }
});

// GET /api/formula/examples - Vietnamese formula examples/docs
router.get('/examples', (req, res) => {
  res.json({
    status: 'success',
    data: {
      examples: [
        {
          input: '2+2',
          output: 4,
          desc: 'Phép tính cơ bản'
        },
        {
          input: '∫x^2 dx',
          latex: '$$\\int x^2 dx$$',
          desc: 'Tích phân'
        },
        {
          input: 'x^2 + 2x + 1 = 0',
          desc: 'Giải phương trình (cần prompt Ollama)'
        }
      ],
      usage: 'POST /eval {"formula": "expr"} hoặc /parse {"text": "with $formulas$"}'
    }
  });
});

module.exports = router;

