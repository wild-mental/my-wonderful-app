import { Product, RegistrationRequest, ErrorReport } from '../types';

export const MOCK_PRODUCT: Product = {
  id: 1,
  image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800",
  brand: "헬스케어랩",
  name: "프리미엄 NMN 250mg",
  servingSize: "1캡슐",
  dailyCost: 850,
  finalPrice: 25500,
  packageInfo: "30일분",
  ingredients: [
    {
      name: "NMN (니코틴아마이드 모노뉴클레오타이드)",
      amount: "250mg",
      status: "CAUTION",
      evidence: "식약처 고시 기능성 원료는 아니나, 국내 일부 제품에서 '니코틴산아마이드' 형태로 인정받은 사례가 있습니다. 다만 NMN 자체는 현재 개별인정형 원료 신청 검토 중입니다.",
    },
    {
      name: "비타민 B3 (나이아신아마이드)",
      amount: "15mg",
      status: "APPROVED",
      evidence: "식품의약품안전처 고시 제2023-86호에 따라 '에너지 생성에 필요, 피부건강 유지에 필요'로 기능성이 인정된 원료입니다.",
    },
    {
      name: "레스베라트롤",
      amount: "50mg",
      status: "APPROVED",
      evidence: "식약처 개별인정형 기능성 원료로 '항산화 작용을 통한 세포 보호'의 기능성이 인정되었습니다. (인정번호: 2019-21)",
    },
    {
      name: "프테로스틸벤",
      amount: "10mg",
      status: "UNREGISTERED",
      evidence: "식약처 등재 원료가 아닙니다. 국내에서 건강기능식품 기능성 원료로 인정받지 못한 성분입니다.",
    },
  ],
};

export const MOCK_REQUESTS: RegistrationRequest[] = [
  {
    id: 1,
    ingredientName: "코엔자임 Q10 (유비퀴논)",
    email: "user1@example.com",
    requestDate: "2026-04-23 14:30",
    status: "pending",
  },
  {
    id: 2,
    ingredientName: "아스타잔틴",
    email: "user2@example.com",
    requestDate: "2026-04-23 13:15",
    status: "pending",
  },
  {
    id: 3,
    ingredientName: "L-테아닌",
    email: "",
    requestDate: "2026-04-23 11:45",
    status: "pending",
  },
  {
    id: 4,
    ingredientName: "베타글루칸",
    email: "user4@example.com",
    requestDate: "2026-04-22 16:20",
    status: "approved",
  },
  {
    id: 5,
    ingredientName: "피크노제놀",
    email: "user5@example.com",
    requestDate: "2026-04-22 10:00",
    status: "rejected",
  },
];

export const MOCK_REPORTS: ErrorReport[] = [
  {
    id: 1,
    productName: "프리미엄 NMN 250mg",
    productId: "1",
    errorType: "price",
    description: "실제 쿠팡 가격은 22,000원인데 25,500원으로 표시되고 있습니다.",
    email: "user1@example.com",
    reportDate: "2026-04-23 15:20",
    status: "pending",
  },
  {
    id: 2,
    productName: "NMN 순도 99% 고함량",
    productId: "2",
    errorType: "ingredient",
    description: "성분표에 비타민 B3가 누락되어 있습니다.",
    email: "user2@example.com",
    reportDate: "2026-04-23 14:10",
    status: "pending",
  },
  {
    id: 3,
    productName: "NMN + 레스베라트롤 복합",
    productId: "3",
    errorType: "badge",
    description: "레스베라트롤이 '인정' 배지로 표시되어야 하는데 '주의'로 나옵니다.",
    email: "",
    reportDate: "2026-04-23 11:30",
    status: "pending",
  },
  {
    id: 4,
    productName: "NMN 150mg 저용량",
    productId: "4",
    errorType: "product_info",
    description: "브랜드명이 '퓨어라이프'가 아니라 '퓨어헬스'입니다.",
    email: "user4@example.com",
    reportDate: "2026-04-22 18:45",
    status: "resolved",
  },
];
