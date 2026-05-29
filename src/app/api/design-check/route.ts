import { NextRequest, NextResponse } from 'next/server';
import { DESIGN_CHECK_PROMPT } from '@/lib/prompts';
import { callLLM, extractJson } from '@/lib/ai';
import { knowledgePoints } from '@/lib/data/knowledge';
import { detectPatterns, generateMockChecklist as generateMockChecklistFromIdea } from '@/lib/data/mock-responses';

export async function POST(req: NextRequest) {
  const { design } = await req.json();

  if (!design || typeof design !== 'string') {
    return NextResponse.json({ error: 'design is required' }, { status: 400 });
  }

  // Extract method type from design text
  const method = detectMethod(design);

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const prompt = DESIGN_CHECK_PROMPT
        .replace('{{design}}', design)
        .replace('{{method}}', method);
      const raw = await callLLM(prompt, design);
      const items = extractJson(raw).map((item: any) => {
        const kp = knowledgePoints.find(
          (k) => k.session === item.refSession && k.topic === item.refTopic,
        );
        return {
          category: item.category,
          point: item.point,
          reason: item.reason,
          example: item.example || '',
          knowledgePoint: {
            session: item.refSession,
            topic: item.refTopic,
            concept: kp?.concept || '',
            pdfFile: kp?.pdfFile || item.refPdf || '',
            pdfPage: kp?.pdfPage || item.refPage || 0,
          },
        };
      });
      return NextResponse.json({ checklist: items, mode: 'llm' });
    } catch {
      // fall through to mock
    }
  }

  const checklist = generateMockChecklist(design, method);
  return NextResponse.json({ checklist, mode: 'mock' });
}

function detectMethod(design: string): string {
  if (/实验|experiment|随机|random|RCT/.test(design)) return '实验';
  if (/二手数据|archival|二手/.test(design)) return '二手数据';
  if (/调查|问卷|survey/.test(design)) return '调查';
  if (/访谈|interview|定性|qualitative/.test(design)) return '定性';
  if (/混合|mixed/.test(design)) return '混合方法';
  return '其他';
}

function findRef(keywords: string[]) {
  for (const kp of knowledgePoints) {
    if (keywords.some((k) => kp.keywords.includes(k))) {
      return {
        session: kp.session,
        topic: kp.topic,
        concept: kp.concept,
        pdfFile: kp.pdfFile,
        pdfPage: kp.pdfPage,
      };
    }
  }
  return {
    session: 9,
    topic: '建立因果关系的三条件',
    concept: 'X precedes Y; X and Y co-vary; Rule out alternative explanations',
    pdfFile: 'Week 9-Experimental Prototype (I).pdf',
    pdfPage: 8,
  };
}

function generateMockChecklist(design: string, method: string): any[] {
  const ref = (kws: string[]) => findRef(kws);
  const items: any[] = [];
  const hasCausality = /影响|效应|导致|因果|cause|effect|X.*Y/.test(design);

  // Generic: internal validity
  items.push({
    category: '研究设计完整性',
    point: '内部效度：您的发现能在多大程度上支持所声称的结论？',
    reason: '如果存在替代性解释或混淆变量，您的发现可能不是由 X 导致的，而是由其他因素。',
    example: '→ 例：替代性解释 → 高创造力的人主动选择灵活工作制（反向因果）\n→ 例：遗漏变量 → 企业文化同时推动灵活工作制和知识共享',
    knowledgePoint: ref(['因果', 'covary']),
  });

  // Method-specific checks
  if (method === '实验') {
    items.push({
      category: '方法适配性',
      point: '随机分配是否可行？能否确保处理组和控制组在处理前等价？',
      reason: '实验的核心优势是随机分配处理了所有未观察到的差异。如果随机化失败，实验就退化为观察性研究。',
      example: '→ 例：检查随机化是否真正执行（是否有参与者拒绝分配？）\n→ 例：操作检查（manipulation check）确认处理确实被感受到',
      knowledgePoint: ref(['实验', '随机']),
    });
    items.push({
      category: '方法适配性',
      point: '如何避免参与者怀疑和 Hawthorne Effect？',
      reason: '如果参与者猜到了实验目的或知道自己被观察，行为会发生改变，导致结果不能推广到自然情境。',
      example: '→ 例：使用 cover story 掩盖真实实验目的\n→ 例：各条件之间的差异应尽可能小，减少怀疑',
      knowledgePoint: ref(['实验', '随机']),
    });
  } else if (method === '二手数据') {
    items.push({
      category: '方法适配性',
      point: '内生性威胁：反向因果、遗漏变量、自选择是否被充分讨论？',
      reason: '二手数据中无法随机化，这些威胁始终存在。需要明确讨论并尝试用 DiD / Matching / IV 等策略处理。',
      example: '→ 例：反向因果 → 用滞后变量或工具变量处理\n→ 例：遗漏变量 → 尽可能控制所有可观察的混淆变量',
      knowledgePoint: ref(['endogeneity', '内生性']),
    });
  } else if (method === '调查') {
    items.push({
      category: '方法适配性',
      point: 'Common method variance 是否被控制？',
      reason: '当自变量和因变量都用同一来源的自评问卷测量时，共同方法偏差可能人为放大两者之间的关系。',
      example: '→ 例：程序控制 → 自变量和因变量在不同时间点测量\n→ 例：统计控制 → Harman 单因子检验或标记变量法',
      knowledgePoint: ref(['survey', '问卷']),
    });
  } else if (method === '定性') {
    items.push({
      category: '方法适配性',
      point: '编码程序是否系统？Saturation 是否达到？',
      reason: '定性数据的分析需要系统的编码程序（Initial → Axial → Targeted axial coding）和饱和检验，否则结果缺乏可信度。',
      example: '→ 例：展示从初始编码到轴心编码的完整过程\n→ 例：报告何时达到饱和（多少条访谈后边际信息为 0）',
      knowledgePoint: ref(['coding', '编码']),
    });
  }

  // Causality (if applicable)
  if (hasCausality) {
    items.push({
      category: '因果识别',
      point: '明确区分"替代性解释"和"额外机制"：前者推翻结论，后者丰富解释',
      reason: '替代性解释否定的是您对结果的解读和结论（X causes Y），而不是统计结果本身。额外机制只是增加一条路径，不否定原有关系。',
      example: '→ 例（替代性解释）→ 是企业文化而非灵活工作制导致了知识共享增加\n→ 例（额外机制）→ 灵活工作制除通过心理安全感外，还通过工作满意度影响知识共享',
      knowledgePoint: ref(['替代性解释', 'alternative']),
    });

    if (!/实验|随机/.test(design)) {
      items.push({
        category: '因果识别',
        point: '如果做不了随机实验，需用观察性数据的因果识别策略',
        reason: '观察数据中无法随机化，需要通过 DiD / Matching / IV 等策略来近似实验原型。每种方法都有自己的核心假设和局限。',
        example: '→ 例：DiD → 需要平行趋势假设，适合有政策冲击的情境\n→ 例：Matching → 在可观察特征上匹配处理组和控制组\n→ 例：IV → 需要找到与 X 相关但只通过 X 影响 Y 的外生变量',
        knowledgePoint: ref(['identification', 'DiD']),
      });
    }
  }

  // External validity
  items.push({
    category: '效度保障',
    point: '外部效度（可推广性）是否被讨论？',
    reason: '即使内部效度很高，如果样本过于特殊或情境过于狭窄，发现可能无法推广到其他情境。',
    example: '→ 例：样本局限在 MBA 学生 → 结论不一定适用于一线员工\n→ 例：横断面数据 → 无法推广到纵向动态过程',
    knowledgePoint: ref(['因果', 'covary']),
  });

  // Portfolio
  items.push({
    category: '研究设计完整性',
    point: '考虑用一组研究（portfolio）而非单一研究',
    reason: '单一研究可能利用了偶然性。多个研究可以做到 Coherent + Complimentary + Progressive，提供更强的证据。',
    example: '→ 例：Study 1 展示现象 → Study 2 建立因果 → Study 3 验证外部效度\n→ 例：Grant & Berry(2011) 的三研究设计范式',
    knowledgePoint: ref(['portfolio', 'replication']),
  });

  return items;
}
