import React, { useRef } from 'react';
import { marked } from 'marked';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { AnalysisData, IndividualAnalysisData, ChartDataPoint, ConsultationEntry } from '../types';
import DoughnutChart from './charts/DoughnutChart';
import BarChartIcon from './icons/BarChartIcon';
import PieChartIcon from './icons/PieChartIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ChatIcon from './icons/ChatIcon';
import EditIcon from './icons/EditIcon';
import CheckIcon from './icons/CheckIcon';
import CalendarIcon from './icons/CalendarIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import LightbulbIcon from './icons/LightbulbIcon';
import LinkIcon from './icons/LinkIcon';

interface AnalysisDisplayProps {
    data: AnalysisData | IndividualAnalysisData;
}

const chartColors = [
    '#0ea5e9', // sky-500
    '#34d399', // emerald-400
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
];

const createMarkup = (markdownText: string | undefined) => {
    if (!markdownText) return { __html: '' };
    const rawMarkup = marked.parse(markdownText, { breaks: true, gfm: true }) as string;
    return { __html: rawMarkup };
};

const MetricCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subValue?: string[] }> = ({ title, value, icon, subValue }) => (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-start gap-4 transition-all hover:shadow-lg hover:scale-[1.02]">
        <div className="bg-sky-100 text-sky-600 p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subValue && (
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-1">
                    {subValue.map((item, index) => (
                        <span key={index} className="bg-slate-100 px-2 py-0.5 rounded-full">{item}</span>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const ChartSection: React.FC<{ title: string; data: ChartDataPoint[]; icon: React.ReactNode }> = ({ title, data, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
        <div className="flex items-center gap-3 mb-4">
            <div className="text-slate-500">{icon}</div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="relative h-48 w-48 mx-auto">
                <DoughnutChart
                    labels={data.map(d => d.label)}
                    data={data.map(d => d.value)}
                    colors={chartColors}
                />
            </div>
            <ul className="space-y-2 text-sm">
                {data.map((item, index) => (
                    <li key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: chartColors[index % chartColors.length] }}></span>
                            <span className="text-slate-600">{item.label}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{item.value.toFixed(1)}%</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const InfoListCard: React.FC<{ title: string; items: string[]; icon: React.ReactNode; iconBgColor: string, iconColor: string }> = ({ title, items, icon, iconBgColor, iconColor }) => (
     <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${iconBgColor} ${iconColor}`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
            {items.map(item => (
                <span key={item} className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">
                    {item}
                </span>
            ))}
            {items.length === 0 && <p className="text-sm text-slate-500">該当する項目はありませんでした。</p>}
        </div>
    </div>
);

const ConsultationList: React.FC<{consultations: ConsultationEntry[]}> = ({consultations}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 mb-4">
                <div className="text-slate-500"><CalendarIcon /></div>
                <h3 className="text-lg font-bold text-slate-800">相談期間</h3>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {consultations.map((c, index) => (
                    <li key={index} className="flex justify-between items-center text-sm p-2 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors">
                        <div className="flex items-center gap-2">
                           <span className="font-semibold text-slate-800">{c.dateTime}</span>
                        </div>
                        <span className="text-slate-600 font-medium">約{c.estimatedDurationMinutes}分</span>
                    </li>
                ))}
                 {consultations.length === 0 && <p className="text-sm text-slate-500">相談履歴の詳細データがありません。</p>}
            </ul>
        </div>
    )
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
    const metricsRef = useRef(null);
    const chartsRef = useRef(null);
    const strengthsRef = useRef(null);
    const insightsRef = useRef(null);
    const individualRef = useRef(null);
    const individualConsultationsRef = useRef(null);

    const isIndividual = 'userId' in data;
    
    if (isIndividual) {
        const individualData = data as IndividualAnalysisData;
        return (
            <div ref={individualRef} className="space-y-6">
                <TransitionGroup component={null}>
                    <CSSTransition nodeRef={metricsRef} timeout={500} classNames="fade-down" appear={true} key="ind-metrics">
                        <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <MetricCard title="相談件数" value={individualData.totalConsultations} icon={<BarChartIcon />} />
                        </div>
                    </CSSTransition>

                    <CSSTransition nodeRef={individualConsultationsRef} timeout={500} classNames="fade-up" appear={true} key="ind-consultation-list">
                        <div ref={individualConsultationsRef}>
                            <ConsultationList consultations={individualData.consultations} />
                        </div>
                    </CSSTransition>

                    <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-themes">
                        <InfoListCard
                            title="キーテーマ"
                            items={individualData.keyThemes}
                            icon={<ChatIcon />}
                            iconBgColor="bg-sky-100"
                            iconColor="text-sky-600"
                        />
                    </CSSTransition>

                    <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-strengths">
                       <InfoListCard
                            title="検出された強み"
                            items={individualData.detectedStrengths}
                            icon={<TrendingUpIcon />}
                            iconBgColor="bg-emerald-100"
                            iconColor="text-emerald-600"
                        />
                    </CSSTransition>
                     <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-dev-areas">
                       <InfoListCard
                            title="今後の成長領域"
                            items={individualData.areasForDevelopment}
                            icon={<EditIcon />}
                            iconBgColor="bg-amber-100"
                            iconColor="text-amber-600"
                        />
                    </CSSTransition>
                     <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-next-steps">
                       <InfoListCard
                            title="提案される次のステップ"
                            items={individualData.suggestedNextSteps}
                            icon={<CheckIcon />}
                            iconBgColor="bg-violet-100"
                            iconColor="text-violet-600"
                        />
                    </CSSTransition>

                    <CSSTransition nodeRef={insightsRef} timeout={500} classNames="fade-up" appear={true} key="ind-insights">
                        <div ref={insightsRef} className="bg-white p-6 rounded-xl shadow-md">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">総合サマリー</h3>
                            <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(individualData.overallSummary)} />
                        </div>
                    </CSSTransition>

                    {/* --- Skill Matching Sections --- */}
                    {individualData.skillMatchingResult && (
                        <>
                            <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-skill-summary">
                                <div className="bg-white p-6 rounded-xl shadow-md">
                                    <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-200 pb-2 mb-4">キャリアプロファイル分析</h3>
                                    <article className="prose prose-slate max-w-none prose-sm" dangerouslySetInnerHTML={createMarkup(individualData.skillMatchingResult.analysisSummary)} />
                                </div>
                            </CSSTransition>

                            <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-skill-roles">
                                <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-sky-100 text-sky-600 p-2 rounded-lg"><BriefcaseIcon /></div>
                                        <h3 className="text-lg font-bold text-slate-800">推奨される職種</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {individualData.skillMatchingResult.recommendedRoles.map(role => (
                                            <div key={role.role} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                                <div className="flex justify-between items-start gap-4">
                                                    <h4 className="font-bold text-md text-sky-800">{role.role}</h4>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs text-slate-500">マッチ度</p>
                                                        <p className="font-bold text-lg text-sky-600">{role.matchScore}%</p>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-2.5 my-2">
                                                    <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${role.matchScore}%` }}></div>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2">{role.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CSSTransition>
                            
                            <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-skill-develop">
                                <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg"><LightbulbIcon /></div>
                                        <h3 className="text-lg font-bold text-slate-800">伸ばすと良いスキル</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {individualData.skillMatchingResult.skillsToDevelop.map(skill => (
                                            <div key={skill.skill} className="bg-slate-50 p-3 rounded-lg">
                                                <h4 className="font-semibold text-emerald-800">{skill.skill}</h4>
                                                <p className="text-sm text-slate-600">{skill.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CSSTransition>

                            <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-skill-resources">
                                 <div className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-violet-100 text-violet-600 p-2 rounded-lg"><LinkIcon /></div>
                                        <h3 className="text-lg font-bold text-slate-800">おすすめ学習リソース</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {individualData.skillMatchingResult.learningResources.map(resource => (
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer" key={resource.title} className="block bg-slate-50 p-3 rounded-lg hover:bg-slate-100 hover:shadow-sm transition-all border border-slate-200 group">
                                            <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-violet-800 group-hover:underline">{resource.title}</h4>
                                            <span className="text-xs font-medium bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{resource.type}</span>
                                            </div>
                                        </a>
                                        ))}
                                    </div>
                                </div>
                            </CSSTransition>

                            <CSSTransition nodeRef={useRef(null)} timeout={500} classNames="fade-up" appear={true} key="ind-hidden-skills">
                                <div className="bg-yellow-50 border-2 border-dashed border-yellow-300 p-6 rounded-xl shadow-md">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-yellow-100 text-yellow-600 p-2 rounded-lg"><LightbulbIcon /></div>
                                        <h3 className="text-lg font-bold text-yellow-800">コンサルタント向け: 隠れたスキル</h3>
                                    </div>
                                    <p className="text-sm text-yellow-700 mb-4">クライアントには直接提示されていない、潜在的な可能性や長期的な視点です。</p>
                                    <div className="space-y-3">
                                        {individualData.hiddenSkills.map(skill => (
                                            <div key={skill.skill} className="bg-white/70 p-3 rounded-lg">
                                                <h4 className="font-semibold text-yellow-900">{skill.skill}</h4>
                                                <p className="text-sm text-slate-600">{skill.reason}</p>
                                            </div>
                                        ))}
                                        {individualData.hiddenSkills.length === 0 && <p className="text-sm text-slate-500">特筆すべき隠れたスキルはありませんでした。</p>}
                                    </div>
                                </div>
                            </CSSTransition>
                        </>
                    )}


                </TransitionGroup>
                 <style>{`
                    .fade-down-appear, .fade-up-appear {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    .fade-down-appear-active, .fade-up-appear-active {
                        opacity: 1;
                        transform: translateY(0);
                        transition: opacity 500ms ease-out, transform 500ms ease-out;
                    }
                `}</style>
            </div>
        );
    }
    
    const comprehensiveData = data as AnalysisData;

    return (
        <div className="space-y-6">
            <TransitionGroup component={null}>
                {/* Key Metrics */}
                <CSSTransition nodeRef={metricsRef} timeout={500} classNames="fade-down" appear={true} key="metrics">
                    <div ref={metricsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricCard title="総相談件数" value={comprehensiveData.keyMetrics.totalConsultations} icon={<BarChartIcon />} />
                        <MetricCard title="主な業界" value={comprehensiveData.keyMetrics.commonIndustries.length > 0 ? comprehensiveData.keyMetrics.commonIndustries[0] : 'N/A'} subValue={comprehensiveData.keyMetrics.commonIndustries} icon={<TrendingUpIcon />} />
                    </div>
                </CSSTransition>

                {/* Charts */}
                <CSSTransition nodeRef={chartsRef} timeout={500} classNames="fade-up" appear={true}
                    // Using a key makes it re-trigger animation on data change
                    key={comprehensiveData.commonChallenges.map(c => c.label).join(',')}>
                    <div ref={chartsRef} className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <ChartSection title="共通の悩み・課題" data={comprehensiveData.commonChallenges} icon={<PieChartIcon />} />
                        <ChartSection title="キャリアにおける希望" data={comprehensiveData.careerAspirations} icon={<PieChartIcon />} />
                    </div>
                </CSSTransition>
                
                {/* Common Strengths */}
                <CSSTransition nodeRef={strengthsRef} timeout={500} classNames="fade-up" appear={true} key="strengths">
                    <div ref={strengthsRef} className="bg-white p-6 rounded-xl shadow-md transition-all hover:shadow-lg">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">相談者によく見られる強み</h3>
                        <div className="flex flex-wrap gap-2">
                            {comprehensiveData.commonStrengths.map(strength => (
                                <span key={strength} className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full">
                                    {strength}
                                </span>
                            ))}
                        </div>
                    </div>
                </CSSTransition>

                {/* Overall Insights */}
                <CSSTransition nodeRef={insightsRef} timeout={500} classNames="fade-up" appear={true} key="insights">
                    <div ref={insightsRef} className="bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">総合的なインサイトと提言</h3>
                        <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={createMarkup(comprehensiveData.overallInsights)} />
                    </div>
                </CSSTransition>
            </TransitionGroup>

            <style>{`
                .fade-down-appear {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                .fade-down-appear-active {
                    opacity: 1;
                    transform: translateY(0);
                    transition: opacity 500ms ease-out, transform 500ms ease-out;
                }
                .fade-up-appear {
                    opacity: 0;
                    transform: translateY(20px);
                }
                .fade-up-appear-active {
                    opacity: 1;
                    transform: translateY(0);
                    transition: opacity 500ms ease-out, transform 500ms ease-out;
                }
            `}</style>
        </div>
    );
};

export default AnalysisDisplay;