import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface CategoryData {
    name: string;
    originalName: string;
    value: number;
    color: string;
    [key: string]: any;
}

interface ExpensePieProps {
    data: CategoryData[];
    onFilter: (type: 'category', value: string) => void;
    formatCurrency: (value: number) => string;
    tooltipContent: (props: any) => React.ReactNode;
}

const Dashboard_ExpensePie: React.FC<ExpensePieProps> = ({ data, onFilter, formatCurrency, tooltipContent }) => {
    if (data.length === 0) {
        return (
            <div className="w-full h-[200px] flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius="70%"
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(_, index) => {
                        const cat = data[index];
                        if (cat && cat.originalName) onFilter('category', cat.originalName);
                    }}
                    cursor="pointer"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <RechartsTooltip
                    content={tooltipContent}
                    formatter={(value: number) => formatCurrency(value)}
                />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default Dashboard_ExpensePie;
