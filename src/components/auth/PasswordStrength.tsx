"use client";

interface Props {
  password: string;
}

export default function PasswordStrength({
  password,
}: Props) {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  const labels = [
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className={`h-2 flex-1 rounded ${
              item < strength
                ? colors[strength - 1]
                : "bg-slate-700"
            }`}
          />
        ))}
      </div>

      {password && (
        <p className="mt-2 text-sm text-slate-400">
          Password Strength:
          <span className="ml-2 text-white">
            {labels[Math.max(strength - 1, 0)]}
          </span>
        </p>
      )}
    </div>
  );
}