"use client";

import { motion } from "motion/react";
import { Link2, PartyPopper, Share2 } from "lucide-react";

const STEPS = [
  {
    icon: Link2,
    title: "받고 싶은 선물 등록",
    body: "상품 링크를 붙여넣으면 이미지와 이름을 자동으로 가져와요. 목표 금액과 마감일만 정하면 끝.",
  },
  {
    icon: Share2,
    title: "친구들에게 공유",
    body: "펀딩 링크를 카톡방에 공유하세요. 친구들은 로그인 없이 바로 참여할 수 있어요.",
  },
  {
    icon: PartyPopper,
    title: "함께 완성하는 선물",
    body: "각자 원하는 만큼 마음을 보태요. 누가 얼마를 냈는지는 서로에게 보이지 않아요.",
  },
];

export default function StepsSection() {
  return (
    <section className="mt-24 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
      {STEPS.map((step, i) => (
        <motion.div
          key={step.title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-500 dark:bg-brand-950/40">
            <step.icon size={20} />
          </div>
          <h2 className="mt-3 font-semibold">
            {i + 1}. {step.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {step.body}
          </p>
        </motion.div>
      ))}
    </section>
  );
}
