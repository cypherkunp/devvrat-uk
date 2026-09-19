import type { Transition, Variants } from 'motion/react'

/** Strong ease-out — built-in CSS easings are too weak (easing.dev). */
export const easeOut = [0.23, 1, 0.32, 1] as const

/** Critically damped page/item settle — under 300ms for UI. */
export const springDefault: Transition = {
  type: 'spring',
  bounce: 0,
  duration: 0.28,
}

/** Status / caption morph — enter. Exit is shorter on the node. */
export const feedbackEnter: Transition = {
  duration: 0.18,
  ease: easeOut,
}

export const feedbackExit: Transition = {
  duration: 0.12,
  ease: easeOut,
}

/** Page → main → footer. Stagger lives on direct motion children only. */
export const pageVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
}

/** Identity card then tile grid — sequential groups, not everything-at-once. */
export const mainVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07 },
  },
}

/** Identity panel: soft settle (no scale — large frosted surfaces look floaty). */
export const panelVariants: Variants = {
  hidden: { opacity: 0, transform: 'translateY(10px)' },
  visible: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: {
      ...springDefault,
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
}

export const groupVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035 } },
}

/** Hardware-accelerated entrance — full `transform`, not Motion `y`. */
export const itemVariants: Variants = {
  hidden: { opacity: 0, transform: 'translateY(8px)' },
  visible: {
    opacity: 1,
    transform: 'translateY(0px)',
    transition: springDefault,
  },
}
