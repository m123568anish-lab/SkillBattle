export default function LoadingCard() {
    return (
        <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="animate-pulse space-y-4">
                <div className="h-8 w-1/2 rounded bg-slate-200"></div>

                <div className="h-5 w-full rounded bg-slate-200"></div>

                <div className="h-5 w-5/6 rounded bg-slate-200"></div>

                <div className="h-5 w-3/4 rounded bg-slate-200"></div>

                <div className="mt-6 h-64 rounded bg-slate-200"></div>
            </div>
        </div>
    );
}