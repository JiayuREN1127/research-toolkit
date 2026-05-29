import { NextRequest, NextResponse } from 'next/server';
import { ABSTRACTION_TRAIN_PROMPT } from '@/lib/prompts';
import { callLLM, extractJson } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { input, level } = await req.json();

  if (!input || typeof input !== 'string') {
    return NextResponse.json({ error: 'input is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = ABSTRACTION_TRAIN_PROMPT
        .replace('{{input}}', input)
        .replace('{{level}}', level || 'topic');
      const raw = await callLLM(prompt, `用户描述：${input}\n当前层级：${level || 'topic'}`);
      const data = extractJson(raw);
      return NextResponse.json(data);
    } catch {
      // fall through to mock
    }
  }

  return NextResponse.json(generateMockAbstractionFeedback(input, level || 'topic'));
}

function generateMockAbstractionFeedback(input: string, level: string): any {
  if (level === 'topic') {
    return {
      feedback: `您描述的「${input.slice(0, 30)}...」涉及的核心主题是组织管理与个体行为的交叉。`,
      suggestion: '尝试用更抽象的术语来概括这个现象，而不是停留在具体描述层面。例如，从"员工在家办公效率降低"抽象为"非传统工作场所对工作绩效的影响"。',
      exampleAbstraction: '这本质上是一个「工作情境重构与员工适应」的主题',
      nextQuestion: '在这个主题下，您觉得哪两个核心要素之间存在某种关系？是正向促进、负向抑制，还是更复杂的关系？',
    };
  } else if (level === 'relationship') {
    return {
      feedback: '您识别出的关系方向是正确的，但需要进一步判断关系的具体类型。',
      suggestion: '关系不仅仅是"X 影响 Y"，需要判断是线性正/负相关、倒U型、调节关系还是中介关系。这直接影响您后续的方法选择。',
      exampleAbstraction: '核心关系：工作自主性 × 工作情境 → 工作绩效（调节关系，情境作为边界条件）',
      nextQuestion: '有什么现象是这个关系抽象难以解释的？或者说，现有理论在这里失效了什么？',
    };
  } else {
    return {
      feedback: '您发现的异常点很有理论价值。这个问题触及了已有理论在新情境下的适用边界。',
      suggestion: '将这个问题进一步精炼为一个具体的研究问题，判断它是否处于 Interestingness 的恰当档位。',
      exampleAbstraction: '研究问题：当工作情境的数字化程度过高时，原本促进绩效的工作自主性是否会因为信息过载而失效？',
      nextQuestion: null,
      summary: '您的三级抽象路径完整：从具体的工作情境变化（Topic），到自主性与绩效的调节关系（Relationship），再到数字化程度作为边界条件的异常发现（Anomaly），已经形成了一个有理论价值的研究问题的雏形。',
    };
  }
}
