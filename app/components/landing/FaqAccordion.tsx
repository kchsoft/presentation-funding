import FaqItem from "./FaqItem";

const FAQS = [
  {
    q: "정말 결제가 진행되나요?",
    a: "아니요, 선물모아는 누가 얼마를 모았는지 정리해주는 역할만 해요. 실제 송금은 계좌번호나 카카오페이 링크로 친구에게 직접 전달받아 진행돼요.",
  },
  {
    q: "참여하는 친구도 로그인이 필요한가요?",
    a: "아니요! 링크만 있으면 로그인 없이 이름과 금액만 입력해서 바로 참여할 수 있어요.",
  },
  {
    q: "다른 친구가 얼마 냈는지 볼 수 있나요?",
    a: "아니요, 개별 참여 금액은 주최자에게만 보여요. 다른 친구들에게는 이름과 메시지, 전체 진행률만 공개돼요.",
  },
  {
    q: "마감일이 지나면 어떻게 되나요?",
    a: "마감일까지 모인 금액 그대로 전달하면 돼요. 목표를 다 못 채워도 괜찮고, 초과해도 그대로 유지돼요.",
  },
  {
    q: "펀딩을 잘못 만들었어요, 삭제할 수 있나요?",
    a: "네, 펀딩 상세 페이지의 '내 펀딩 관리'에서 언제든 삭제할 수 있어요.",
  },
];

export default function FaqAccordion() {
  return (
    <div className="divide-y divide-black/5 rounded-2xl border border-black/5 bg-white dark:divide-white/10 dark:border-white/10 dark:bg-neutral-900">
      {FAQS.map((f) => (
        <FaqItem key={f.q} question={f.q} answer={f.a} />
      ))}
    </div>
  );
}
