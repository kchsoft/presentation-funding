"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const COLORS = ["#f43f5e", "#fb923c", "#facc15", "#34d399", "#60a5fa", "#a78bfa"];
const PIECE_COUNT = 48;

interface Piece {
  id: number;
  left: number; // vw %
  color: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  rotate: number;
}

// 렌더링 중에는 Math.random() 같은 순수하지 않은 호출을 할 수 없으므로
// 조각 배치는 모듈 로드 시 한 번만 계산해 재사용한다 — 축하 연출은
// 아주 가끔 보이는 일회성 이펙트라 매번 완전히 같은 배치여도 체감상 문제없다.
const PIECES: Piece[] = Array.from({ length: PIECE_COUNT }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  color: COLORS[i % COLORS.length],
  size: 6 + Math.random() * 6,
  duration: 1.8 + Math.random() * 1.2,
  delay: Math.random() * 0.3,
  drift: (Math.random() - 0.5) * 120,
  rotate: Math.random() * 360,
}));

/**
 * 목표 달성 순간의 축하 연출. trigger가 바뀔 때마다(bump 카운터) 터지고
 * ~2.5초 후 스스로 사라진다. trigger === 0(초기값)일 때는 발동하지 않는다.
 */
export default function Confetti({ trigger }: { trigger: number }) {
  const [show, setShow] = useState(false);
  const [prevTrigger, setPrevTrigger] = useState(trigger);

  // prop 변화에 맞춰 state를 조정하는 React 공식 패턴 — effect 없이 렌더링 중에 처리한다.
  if (trigger !== prevTrigger) {
    setPrevTrigger(trigger);
    setShow(trigger !== 0);
  }

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 2800);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {PIECES.map((p) => (
            <motion.span
              key={p.id}
              initial={{ y: -20, x: 0, opacity: 1, rotate: 0 }}
              animate={{
                y: "100vh",
                x: p.drift,
                opacity: [1, 1, 0],
                rotate: p.rotate,
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
              style={{
                position: "absolute",
                left: `${p.left}%`,
                top: 0,
                width: p.size,
                height: p.size * 0.4,
                background: p.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
