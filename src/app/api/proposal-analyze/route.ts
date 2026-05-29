import { NextRequest, NextResponse } from 'next/server';
import { callLLM, extractJson } from '@/lib/ai';
import { PROPOSAL_ANALYZE_PROMPT } from '@/lib/prompts';
import { knowledgePoints } from '@/lib/data/knowledge';

export async function POST(req: NextRequest) {
  const { proposal } = await req.json();

  if (!proposal || typeof proposal !== 'string') {
    return NextResponse.json({ error: 'proposal is required' }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const raw = await callLLM(PROPOSAL_ANALYZE_PROMPT, proposal);
      const items = extractJson(raw).map((item: any) => {
        const kp = knowledgePoints.find(
          (k) => k.session === item.refSession && k.topic === item.refTopic,
        );
        return {
          category: item.category,
          point: item.point,
          reason: item.reason,
          suggestion: item.suggestion || '',
          severity: item.severity || 'warning',
          knowledgePoint: {
            session: item.refSession,
            topic: item.refTopic,
            concept: kp?.concept || '',
            pdfFile: kp?.pdfFile || item.refPdf || '',
            pdfPage: kp?.pdfPage || item.refPage || 0,
          },
        };
      });
      return NextResponse.json({ diagnosis: items, mode: 'llm' });
    } catch {
      // fall through to mock
    }
  }

  // Mock response
  const diagnosis = generateMockDiagnosis(proposal);
  return NextResponse.json({ diagnosis, mode: 'mock' });
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
    session: 2,
    topic: 'Set the Hook',
    concept: 'Who cares? So what? 明确对话的学术群体',
    pdfFile: 'Week 2-Research Question and Contributions.pdf',
    pdfPage: 16,
  };
}

function generateMockDiagnosis(proposal: string): any[] {
  const ref = (kws: string[]) => findRef(kws);
  const items: any[] = [];

  // Check for RQ
  const hasRQ = /研究问题|research question|RQ|我想研究|假设/.test(proposal);
  const hasWhatWeKnow = /已有研究|文献|what.*know|已有/.test(proposal);
  const hasWhatWeDontKnow = /不足|空白|don't know|尚未|不充分|so what/.test(proposal);

  // Research Question quality
  if (!hasRQ) {
    items.push({
      category: '研究问题质量',
      point: '研究问题（Research Question）不够清晰或缺失',
      reason: '研究问题是整个 proposal 的核心。没有清晰的 RQ，后续的文献综述、方法选择和假设都无法聚焦。',
      suggestion: '明确写出您的 Research Question，确保它"不 obvious 但不止一个可能答案"（Interestingness 恰当档位）。',
      severity: 'error',
      knowledgePoint: ref(['who cares', '对话']),
    });
  } else {
    items.push({
      category: '研究问题质量',
      point: '研究问题已初步提出',
      reason: '您已经有明确的研究方向，这是好的开始。但需要进一步判断它落在 Interestingness 的哪一档。',
      suggestion: '对照"走得太远"（套路化新颖、过度反直觉）和"不够"（直白显然）两档，判断您的 RQ 是否处于恰当位置。',
      severity: 'ok',
      knowledgePoint: ref(['interesting', '新颖']),
    });
  }

  // What do we know
  if (!hasWhatWeKnow) {
    items.push({
      category: '文献综述完整性',
      point: '"What do we know"部分缺失或过于简略',
      reason: 'Know the conversation so that we can contribute to the conversation。不了解已有发现，就无法定位自己的贡献。',
      suggestion: '系统梳理与您的 RQ 相关的已有文献理解，不只是定义，而是关键发现和理论视角。',
      severity: 'error',
      knowledgePoint: ref(['文献综述', 'conversation']),
    });
  } else {
    items.push({
      category: '文献综述完整性',
      point: '已有文献综述有基础，但可以更深入',
      reason: '文献综述不应只是罗列发现，而应该展示这场"对话"进行到了哪一步、有哪些矛盾和共识。',
      suggestion: '尝试用"三步归纳法"：宽分类 → 细分类 → 整合框架，来组织您的文献综述。',
      severity: 'warning',
      knowledgePoint: ref(['综合', 'categorize']),
    });
  }

  // What don't we know
  if (!hasWhatWeDontKnow) {
    items.push({
      category: '研究空白',
      point: '"What don\'t we know"（研究空白）缺失',
      reason: '仅仅描述已有发现不够，必须指出现有文献的不足或矛盾，才能定位您的贡献。',
      suggestion: '明确指出已有文献的不足、矛盾或未解之处。',
      severity: 'error',
      knowledgePoint: ref(['so what', '对话']),
    });
  }

  // SO WHAT diagnosis (separate dimension)
  if (!hasWhatWeDontKnow) {
    items.push({
      category: 'SO WHAT 诊断',
      point: 'SO WHAT 完全缺失——已有答案为何不充分没有被回答',
      reason: 'SO WHAT 是 proposal 存在的理由。没有它，研究就只是重复已有发现，无法说服任何读者或审稿人。',
      suggestion: '明确回答：如果这篇论文被写出来了，谁会关心？他们能从中学到什么？已有文献的哪个假设、结论或边界条件会被改变、挑战或推进？',
      severity: 'error',
      knowledgePoint: ref(['contribution', '理论贡献']),
    });
  } else if (!hasWhatWeDontKnow || !/不充分|不充分|不足|矛盾|空白|gap|尚未|局限/.test(proposal)) {
    items.push({
      category: 'SO WHAT 诊断',
      point: 'SO WHAT 陈述不够清晰——读者无法判断您的研究为什么重要',
      reason: '即使指出了研究空白，如果没有说明这个空白为什么值得填补，proposal 仍然缺乏说服力。',
      suggestion: '用一句话清楚陈述您的研究的理论贡献：它将 change / challenge / fundamentally advance 哪个已有理解。避免"增加一个新情境下的实证例子"这种不够贡献性的表述。',
      severity: 'warning',
      knowledgePoint: ref(['contribution', '理论贡献']),
    });
  } else {
    items.push({
      category: 'SO WHAT 诊断',
      point: '已初步陈述研究意义，但需要更强的贡献定位',
      reason: 'SO WHAT 不能只是一个模糊的"填补空白"。需要明确您的研究如何具体地改变、挑战或推进已有理解。',
      suggestion: '将 SO WHAT 精确定位到具体文献的具体结论或假设——您的研究将对哪个已知关系、哪个边界条件、哪个理论机制提出新的理解。',
      severity: 'ok',
      knowledgePoint: ref(['contribution', '理论贡献']),
    });
  }

  // Logical consistency
  if (/假设|命题|hypothesis/.test(proposal) && !hasRQ) {
    items.push({
      category: '逻辑一致性',
      point: '假设似乎先于研究问题提出',
      reason: '研究问题应该导致您的假设，而不是反过来。不要为一个您已有的答案编造问题。',
      suggestion: '从您的研究问题出发，推导出假设。确保假设是 RQ 的自然延伸，而非预先设定的结论。',
      severity: 'warning',
      knowledgePoint: ref(['contribution', '理论贡献']),
    });
  }

  // Contribution positioning
  items.push({
    category: '贡献定位',
    point: '需要明确您的研究属于 change / challenge / fundamentally advance 哪个层面',
    reason: '仅仅增加一个新的实证例子不是理论贡献。需要改变、挑战或根本推进我们对该领域的理解。',
    suggestion: '明确陈述您的研究将如何改变、挑战或推进已有理解，而不是只增加一个"新情境下的验证"。',
    severity: 'warning',
    knowledgePoint: ref(['contribution', '理论贡献']),
  });

  return items;
}
