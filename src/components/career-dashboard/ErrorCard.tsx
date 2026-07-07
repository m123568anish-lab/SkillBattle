interface ErrorCardProps {
    message: string;
}

export default function ErrorCard({
    message,
}: ErrorCardProps) {
    return (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-8">
            <h2 className="text-xl font-bold text-red-600">
                Dashboard Error
            </h2>

            <p className="mt-4 text-red-500">
                {message}
            </p>
        </div>
    );
}