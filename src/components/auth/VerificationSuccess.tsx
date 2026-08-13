"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export default function VerificationSuccess() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.7,
      }}
      animate={{
        opacity: 1,
        scale: 1,
      }}
      transition={{
        duration: 0.5,
      }}
      className="flex flex-col items-center justify-center py-12"
    >
      <motion.div
        initial={{
          scale: 0,
          rotate: -180,
        }}
        animate={{
          scale: 1,
          rotate: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 15,
        }}
        className="mb-6 rounded-full bg-green-500/20 p-6"
      >
        <CheckCircle2
          size={70}
          className="text-green-400"
        />
      </motion.div>

      <h2 className="text-3xl font-bold text-white">
        Email Verified
      </h2>

      <p className="mt-3 text-center text-slate-400">
        Redirecting to your personalized dashboard...
      </p>
    </motion.div>
  );
}