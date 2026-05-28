import { ChecklistItem } from '../types';
import { knowledgePoints } from './knowledge';

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
    session: 1,
    topic: 'Methods vs Methodology',
    concept: '方法是对具体工具的使用，方法论是对"为什么用这个方法"的反思性意识',
    pdfFile: 'Week 1-Introduction.pdf',
    pdfPage: 3,
  };
}

interface DetectedPatterns {
  hasCausality: boolean;
  hasConstructs: boolean;
  hasLevel: boolean;
  hasLiterature: boolean;
  hasMethod: boolean;
  hasMechanism: boolean;
  hasNovelty: boolean;
  hasContext: boolean;
}

export function detectPatterns(idea: string): DetectedPatterns {
  return {
    hasCausality: /影响|效应|导致|引起|因果|cause|effect|impact|关系/.test(idea),
    hasConstructs: /\w/.test(idea) && idea.length > 10,
    hasLevel: /微观|中观|宏观|个体|团队|组织|level|micro|macro/.test(idea),
    hasLiterature: /文献|已有研究|文献综述|lit/.test(idea),
    hasMethod: /实验|调查|问卷|访谈|定性|定量|二手数据|问卷|experiment|survey|qual/.test(idea),
    hasMechanism: /机制|中介|调节|为什么|mediator|moderator|mechanism|路径/.test(idea),
    hasNovelty: /新|创新|novel|创新|独特|填补空白|尚未研究/.test(idea),
    hasContext: /中国|企业|员工|学生|行业|context|情境|样本/.test(idea),
  };
}

export function generateMockQuestions(idea: string): string[] {
  const p = detectPatterns(idea);
  const questions: string[] = [];

  if (!p.hasLevel) {
    questions.push('你的研究层面是微观（个体）、中观（团队）还是宏观（组织）？这会影响你的方法选择和文献对话对象。');
  }
  if (p.hasCausality && !p.hasMechanism) {
    questions.push('你假设的因果机制是什么？X 通过什么路径或过程影响 Y？有没有考虑中介或调节变量？');
  }
  if (!p.hasContext) {
    questions.push('你的研究情境和目标样本是什么？（如：哪个行业、哪类人群、哪个国家/地区？）');
  }
  questions.push('你的核心构念具体如何操作化？每个关键变量你打算如何测量？');
  if (p.hasCausality) {
    questions.push('你打算如何排除替代性解释？除了 X→Y，还有什么其他原因可能导致你观察到的关系？');
  }
  if (!p.hasLiterature) {
    questions.push('在这个话题上，已有的文献对话进行到哪里了？你知道这场"对话"中已有谁在说话吗？');
  }
  if (p.hasNovelty) {
    questions.push('你的"新"属于哪种类型？是 new mechanism、new boundary condition 还是 new concept？');
  }

  return questions.slice(0, 5);
}

export function generateMockChecklist(idea: string, _answers: string): ChecklistItem[] {
  const p = detectPatterns(idea);
  const items: ChecklistItem[] = [];

  const ref = (kws: string[]) => findRef(kws);

  // --- 研究问题质量 ---
  items.push({
    category: '研究问题质量',
    point: '确认研究问题处于 Interestingness 的恰当档：不 obvious 但不止一个可能答案',
    reason: '走得太远（套路化双刃剑、过度反直觉）和不够（直白显然）都会削弱论文的贡献力。需要先判断你的问题落在哪一档。',
    example: '→ 例：「远程办公影响创造力」→ 太直白（已知太多）\n→ 例：「远程办公既提升又降低创造力」→ 套路化双刃剑\n→ 恰当：「在高不确定性情境下，远程办公通过数字工具丰富度对创造力产生倒U型效应」',
    knowledgePoint: ref(['interesting', '新颖']),
  });

  items.push({
    category: '研究问题质量',
    point: '核心构念需要有清晰的理论定义和操作化定义',
    reason: '如果构念的定义模糊，后续的测量、文献对话和方法选择都会失焦。需要能说清楚"你说的 X 到底是什么"。',
    example: '→ 例：「创造力」→ 需明确是个体创新行为自评、代码新颖性评分、还是专利产出\n→ 例：「远程办公」→ 需明确是每周远程天数占比、还是混合/纯远程的二分类',
    knowledgePoint: ref(['因果', 'covary']),
  });

  if (!p.hasLevel) {
    items.push({
      category: '研究问题质量',
      point: '研究层面（微观/中观/宏观）需要明确界定',
      reason: '不同层面会导向完全不同的文献对话对象和方法选择。微观用 survey/experiment，宏观用 archival data。',
      example: '→ 例：微观 → 个体员工创造力（量表测量）\n→ 例：中观 → 团队知识共享网络（社会网络分析）\n→ 例：宏观 → 行业创新产出（专利数据库）',
      knowledgePoint: ref(['微观', '中观', '宏观']),
    });
  }

  // --- 文献综述 ---
  items.push({
    category: '文献综述',
    point: '文献综述需要做到三步归纳：categorize → further categorize → integrative framework',
    reason: '仅仅罗列文献发现无法帮助建立理论对话。需要先宽分类、再细分类、最后整合成一个框架，才能定位你的贡献位置。',
    example: '→ 例：宽分类 → 远程办公研究分 productivity 和 well-being 两条线\n→ 例：细分类 → productivity 线又分 task performance 和 innovation\n→ 例：整合 → 发现创新维度的边界条件尚不清晰',
    knowledgePoint: ref(['综合', 'categorize']),
  });

  if (!p.hasLiterature) {
    items.push({
      category: '文献综述',
      point: '需要明确你的研究要贡献给哪个 ongoing conversation',
      reason: 'Know the conversation so that we can contribute to the conversation。不知道对话进行到哪，就无法定位自己的贡献。',
      example: '→ 例：对话对象可能是 OB 领域的 work arrangement 文献\n→ 例：也可能是 innovation 领域的 creativity antecedents 文献\n→ 关键：选定后需要系统检索该领域的 top journals',
      knowledgePoint: ref(['文献综述', 'conversation']),
    });
  }

  // --- 方法决策 ---
  items.push({
    category: '方法决策',
    point: '方法选择应直接匹配理论构念，而非套用传统工具',
    reason: '当方法直接操作化感兴趣的理论构念而非套用传统工具时，方法创新就成功了。方法创新应该服务于理论突破。',
    example: '→ 例：用 LDA 文本分析提取文化异质性（Corritore et al. 2020），而非用静态问卷\n→ 例：用视频行为编码捕捉冲突互动微观动态（Park et al. 2024）',
    knowledgePoint: ref(['innovation', '创新']),
  });

  if (p.hasMechanism) {
    items.push({
      category: '方法决策',
      point: '机制（mediator/moderator）需要有清晰的理论机制和可操作的实证测量',
      reason: '理论机制回答"为什么"，实证机制回答"怎么测"。两者不能混淆。同时需区分 additional mechanism 和 alternative explanation。',
      example: '→ 例：中介「心理安全感」→ 可用 Edmondson(1999) 7项量表\n→ 例：调节「技术依赖」→ 需开发或改编现有量表，报告信效度',
      knowledgePoint: ref(['mechanism', '中介']),
    });
  }

  items.push({
    category: '方法决策',
    point: '考虑用一组研究（portfolio）而非单一研究来增强结论可信度',
    reason: '单一研究可能利用了偶然性。多个研究可以做到 Coherent（围绕同一核心问题）+ Complimentary（方法互补）+ Progressive（递进深入）。',
    example: '→ 例：Study 1 用 survey 展示现象 → Study 2 用实验建立因果 → Study 3 用二手数据验证外部效度\n→ 例：Grant & Berry(2011) 的三研究设计范式',
    knowledgePoint: ref(['portfolio', 'replication']),
  });

  // --- 因果识别 ---
  if (p.hasCausality) {
    items.push({
      category: '因果识别',
      point: '必须满足因果推断三条件：X precedes Y、X-Y covary、排除替代性解释',
      reason: '最难的是第三条。即使 X 和 Y 相关，如果存在其他原因导致这个共变，你的因果结论就会被推翻。',
      example: '→ 例：替代性解释 → 高创造力的人主动选择四天工作制（反向因果）\n→ 例：遗漏变量 → 企业文化同时推动四天工作制和知识共享\n→ 例：自选择 → 更有安全感的员工自愿参与调研',
      knowledgePoint: ref(['因果', 'causality']),
    });

    items.push({
      category: '因果识别',
      point: '明确区分"替代性解释"和"额外机制"：前者推翻结论，后者丰富解释',
      reason: '替代性解释否定的是你对结果的解读和结论（X causes Y），而不是统计结果本身。额外机制只是增加一条路径，不否定原有关系。',
      example: '→ 例（替代性解释）→ 是企业文化而非四天工作制导致了知识共享增加\n→ 例（额外机制）→ 四天工作制除通过心理安全感外，还通过工作满意度影响知识共享',
      knowledgePoint: ref(['替代性解释', 'alternative']),
    });

    if (!p.hasMethod || !/实验|随机/.test(idea)) {
      items.push({
        category: '因果识别',
        point: '如果做不了随机实验，需用观察性数据的因果识别策略',
        reason: '观察数据中无法随机化，需要通过 DiD / Matching / IV 等策略来近似实验原型。每种方法都有自己的核心假设和局限。',
        example: '→ 例：DiD → 需要平行趋势假设，适合有政策冲击的情境\n→ 例：Matching (CEM/PSM) → 在可观察特征上匹配处理组和控制组\n→ 例：IV → 需要找到与 X 相关但只通过 X 影响 Y 的外生变量',
        knowledgePoint: ref(['identification', 'DiD']),
      });
    }
  }

  // --- 理论贡献 ---
  items.push({
    category: '理论贡献',
    point: '研究需要做到 change, challenge, or fundamentally advance 已有理解',
    reason: '仅仅增加一个新的实证例子（replication without extension）不是理论贡献。需要改变、挑战或根本推进我们对该领域概念、关系或模型的理解。',
    example: '→ 例（change）→ 发现资源保存理论在数字工作情境下的作用机制不同于传统情境\n→ 例（challenge）→ 证明四天工作制在某些条件下反而降低知识共享\n→ 例（advance）→ 将社会交换理论延伸到混合工作情境中的知识管理',
    knowledgePoint: ref(['contribution', '理论贡献']),
  });

  return items;
}
