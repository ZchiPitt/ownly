import { useNavigate } from 'react-router-dom';

const SAMPLE_QUERIES = [
    "I need some space, what are the things that I can drop",
    "Shall I buy any new stuff",
    "I wanna find my soccer ball, where is it",
];

export function AgentSection() {
    const navigate = useNavigate();

    const handleQueryClick = (query: string) => {
        // Navigate to shopping page with the query as a URL parameter
        navigate(`/shopping?query=${encodeURIComponent(query)}`);
    };

    const handleMicClick = () => {
        // Navigate to shopping page (voice input can be implemented later)
        navigate('/shopping');
    };

    return (
        <div className="bg-teal-600 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-lg">
            {/* Background decoration (Circuit/Brain pattern placeholder) */}
            <div className="absolute right-0 top-0 h-full w-1/2 opacity-10 pointer-events-none">
                <svg viewBox="0 0 200 200" className="h-full w-full">
                    <path fill="currentColor" d="M150,50 C180,50 180,100 150,150" />
                    {/* Add more complex paths for "brain" look if needed */}
                </svg>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Talk to the Ownly Agent!
                    </h2>
                    <button
                        onClick={handleMicClick}
                        className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-3 backdrop-blur-sm cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-xs font-bold tracking-widest uppercase text-teal-100 mb-3">Sample Queries</p>
                    <div className="space-y-3">
                        {SAMPLE_QUERIES.map((query, index) => (
                            <button
                                key={index}
                                onClick={() => handleQueryClick(query)}
                                className="w-full text-left bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors rounded-xl px-4 py-3 flex items-center justify-between group"
                            >
                                <span className="text-sm md:text-base font-medium truncate pr-4">{query}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                                    </svg>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
