export interface DashboardData {

    resume: {

        id: string;

        filename: string;

        uploaded_at: string;

    };

    analysis: {

        summary: string;

        strengths: string[];

        weaknesses: string[];

        resume_score: number;

    };

    ats: {

        ats_score: number;

    };

    placement: {

        placement_score: number;

    };

    portfolio: {

        portfolio_score: number;

    };

}