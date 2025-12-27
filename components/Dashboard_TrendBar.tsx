import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface BarData {
    name: string;
    key: string;
    income: number;
    expense: number;
}

interface TrendBarProps {
    data: BarData[];
    onFilter: (type: 'date', value: string) => void;
    language: string;
}

const Dashboard_TrendBar: React.FC<TrendBarProps> = ({ data, onFilter, language }) => {
    if (data.length === 0) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart
                data={data}
                barGap={4}
                margin={{ left: -20, right: 0 }}
                onClick={(clickedData: any) => {
                    if (clickedData && clickedData.activePayload && clickedData.activePayload[0]) {
                        onFilter('date', clickedData.activePayload[0].payload.key);
                    }
                }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 4, 4]} barSize={8} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 4, 4]} barSize={8} />
            </BarChart>
        </ResponsiveContainer>
    );
};

export default Dashboard_TrendBar;
