import { NextRequest, NextResponse } from 'next/server';
import { CAUSALITY_SANDBOX_PROMPT } from '@/lib/prompts';
import { callLLM, extractJson } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const { hypothesis, stage } = await req.json();

  if (!hypothesis || typeof hypothesis !== 'string') {
    return NextResponse.json({ error: 'hypothesis is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = CAUSALITY_SANDBOX_PROMPT
        .replace('{{hypothesis}}', hypothesis)
        .replace('{{stage}}', stage || 'alternatives');
      const raw = await callLLM(prompt, `假设：${hypothesis}\n阶段：${stage || 'alternatives'}`);
      const data = extractJson(raw);
      return NextResponse.json(data);
    } catch {
      // fall through to mock
    }
  }

  return NextResponse.json(generateMockCausalityData(hypothesis, stage || 'alternatives'));
}

function generateMockCausalityData(hypothesis: string, stage: string): any {
  if (stage === 'alternatives') {
    return {
      items: [
        {
          name: '反向因果',
          description: `可能是 Y 反过来影响 X。例如：有创造力的人更可能选择/争取灵活的工作安排，而非灵活工作制导致创造力。`,
          severity: 'high',
          howToAddress: '使用滞后变量设计（先测 X 后测 Y）或寻找外生冲击作为处理分配。',
        },
        {
          name: '遗漏变量',
          description: '可能存在第三个变量 Z 同时导致 X 和 Y。例如：创新型企业文化同时推动灵活工作制和鼓励创造力。',
          severity: 'high',
          howToAddress: '尽可能控制所有可观察的混淆变量，或使用固定效应模型处理未观察到的时间不变异质性。',
        },
        {
          name: '自选择',
          description: '受试者可能自己选择进入灵活工作制（处理组），而非随机分配。选择灵活工作制的员工可能本身就更有创造力。',
          severity: 'medium',
          howToAddress: '使用 Propensity Score Matching 或 Coarsened Exact Matching 在可观察特征上匹配两组。',
        },
        {
          name: '测量误差',
          description: 'X（远程办公程度）和 Y（创造力）的测量可能存在偏差，特别是都用自评问卷时。',
          severity: 'medium',
          howToAddress: '使用多来源数据（如领导评价创造力）或客观指标（如代码新颖性评分）。',
        },
        {
          name: '时间趋势',
          description: '从引入灵活工作制到测量创造力之间的时间段内，可能发生了其他影响创造力的变化（如新项目启动、团队重组）。',
          severity: 'low',
          howToAddress: '使用面板数据和控制组比较，或通过 DID 设计排除时间趋势。',
        },
      ],
      summary: `你的假设「${hypothesis.slice(0, 40)}...」面临的主要因果威胁是反向因果和遗漏变量，这两个是高威胁。需要先排除这两者，结论才能成立。`,
      nextStep: '进入第二步，评估每个替代性解释在当前情境下的严重程度。',
    };
  } else if (stage === 'evaluate') {
    return {
      items: [
        {
          name: '反向因果',
          description: '在当前情境下，反向因果是高威胁。因为创造力是相对稳定的个体特质，很可能在灵活工作制之前就存在差异。',
          severity: 'high',
          howToAddress: '建议在引入灵活工作制之前测量员工的创造力基线，或使用实验设计随机分配灵活工作条件。',
        },
        {
          name: '遗漏变量（企业文化）',
          description: '企业文化是最可能的遗漏变量。创新型公司既更可能采用灵活工作制，又更鼓励创造力。',
          severity: 'high',
          howToAddress: '控制企业文化指标（如创新氛围评分），或使用公司固定效应。',
        },
        {
          name: '自选择',
          description: '中等威胁。如果灵活工作制是公司统一政策而非员工自选，则自选择威胁较低。',
          severity: 'medium',
          howToAddress: '如果是公司统一政策，说明政策分配机制；如果是自选，使用 Matching 处理。',
        },
        {
          name: '测量误差',
          description: '创造力用自评问卷测量偏差较大，建议结合他评或客观指标。',
          severity: 'medium',
          howToAddress: '多来源多方法测量：自评 + 领导评价 + 客观产出评估。',
        },
      ],
      summary: '反向因果和遗漏变量是两大核心威胁，需要通过研究设计层面的手段处理。自选择和测量误差可以通过统计控制和多方法测量减轻。',
      nextStep: '进入第三步，为未能排除的威胁匹配合适的因果识别策略。',
    };
  } else {
    return {
      items: [
        {
          name: 'RCT（随机控制实验）',
          description: '最优方案。如果能在组织内随机分配员工到灵活工作制组和对照组，可以一次性处理所有替代性解释。',
          severity: 'low',
          howToAddress: '随机分配确保处理组和控制组在处理前等价，随机处理了所有未观察到的差异。',
        },
        {
          name: 'DiD（双重差分）',
          description: '如果某公司"突然"引入灵活工作制（外生政策冲击），可以比较政策前后处理组和对照组的变化差异。',
          severity: 'medium',
          howToAddress: '需要满足平行趋势假设：如果没有政策，两组的变化趋势应该相同。',
        },
        {
          name: 'Matching（匹配）',
          description: '在可观察特征（如年龄、职级、工龄、创造力基线）上匹配处理组和控制组，使两组尽可能可比。',
          severity: 'medium',
          howToAddress: '推荐使用 CEM（Coarsened Exact Matching）而非 PSM，不依赖共同支撑区域，保留更多原始样本。',
        },
        {
          name: 'IV（工具变量）',
          description: '如果能找到一个与灵活工作制相关但只通过灵活工作制影响创造力的外生变量（如办公室距离政策变化），可以作为工具变量。',
          severity: 'medium',
          howToAddress: '需要满足两个条件：相关性（IV 与 X 相关）和排他性约束（IV 只通过 X 影响 Y）。',
        },
      ],
      summary: '最优方案是 RCT。如果不可行，DiD（有外生政策冲击时）或 Matching（有丰富协变量时）是次优选择。IV 需要找到合适工具变量，难度较大。',
      nextStep: null,
    };
  }
}
