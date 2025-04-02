import Link from 'next/link';
import { FaRobot, FaChartLine, FaSearchDollar, FaBriefcase, FaArrowRight } from 'react-icons/fa';

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center">
            {/* 顶部横幅 */}
            <div className="w-full px-6 py-12 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <div className="container mx-auto max-w-6xl">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-4">LumosFund AI</h1>
                    <h2 className="text-xl sm:text-2xl font-light mb-6">
                        AI驱动的量化交易平台，让投资决策更智能
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/dashboard" className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold flex items-center hover:bg-gray-100 transition">
                            开始使用 <FaArrowRight className="ml-2" />
                        </Link>
                        <Link href="/backtest" className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold flex items-center hover:bg-indigo-800 transition">
                            回测策略
                        </Link>
                    </div>
                </div>
            </div>

            {/* 主要功能展示 */}
            <div className="container mx-auto max-w-6xl px-6 py-16">
                <h2 className="text-3xl font-bold text-center mb-12">强大的AI交易助手</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <FeatureCard
                        icon={<FaRobot className="text-3xl text-indigo-600" />}
                        title="AI交易代理"
                        description="智能代理分析市场数据，提供专业的投资建议和执行交易策略。"
                        link="/ai-agent"
                    />
                    <FeatureCard
                        icon={<FaChartLine className="text-3xl text-indigo-600" />}
                        title="技术分析"
                        description="全面的技术指标分析，识别市场趋势和交易信号。"
                        link="/analysis/technical"
                    />
                    <FeatureCard
                        icon={<FaSearchDollar className="text-3xl text-indigo-600" />}
                        title="基本面研究"
                        description="深入分析公司财务状况、盈利能力和增长前景。"
                        link="/analysis/fundamental"
                    />
                    <FeatureCard
                        icon={<FaBriefcase className="text-3xl text-indigo-600" />}
                        title="投资组合优化"
                        description="基于现代投资组合理论的资产配置和风险管理。"
                        link="/portfolio"
                    />
                </div>
            </div>

            {/* AI代理介绍 */}
            <div className="w-full bg-gray-50 py-16">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-full md:w-1/2 mb-8 md:mb-0">
                            <h2 className="text-3xl font-bold mb-4">认识您的AI交易助手</h2>
                            <p className="text-gray-600 mb-6">
                                LumosFund AI助手是一个基于先进大语言模型的交易代理，能够理解复杂的金融概念和市场动态。它不仅能分析大量的市场数据，还可以执行交易策略和优化投资组合。
                            </p>
                            <ul className="space-y-2">
                                {[
                                    "实时市场分析与洞察",
                                    "多策略交易执行与跟踪",
                                    "自动投资组合优化与再平衡",
                                    "风险管理与风险预警",
                                    "个性化投资建议"
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center text-gray-700">
                                        <span className="mr-2 text-green-500">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/ai-agent" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                                了解更多
                            </Link>
                        </div>
                        <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-lg">
                            <div className="h-64 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                <div className="text-center p-6">
                                    <FaRobot className="text-6xl text-indigo-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">LumosFund AI</h3>
                                    <p className="text-gray-600">基于Mastra框架打造的新一代AI交易助手</p>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-gray-700 italic">
                                    "我的目标是帮助您做出更明智的投资决策，提供及时的市场分析和专业的投资建议，同时根据您的风险偏好优化投资组合。"
                                </p>
                                <p className="mt-2 text-right text-sm text-gray-500">— LumosFund AI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 回测系统介绍 */}
            <div className="container mx-auto max-w-6xl px-6 py-16">
                <div className="flex flex-col md:flex-row-reverse items-center gap-8">
                    <div className="w-full md:w-1/2 mb-8 md:mb-0">
                        <h2 className="text-3xl font-bold mb-4">强大的策略回测系统</h2>
                        <p className="text-gray-600 mb-6">
                            使用我们的回测系统，您可以在实际投资前测试和验证各种交易策略的表现。系统支持多种策略模型，包括价值投资、技术分析、情绪分析和混合策略。
                        </p>
                        <ul className="space-y-2">
                            {[
                                "多种策略模型支持",
                                "详细的绩效指标分析",
                                "交易记录和权益曲线",
                                "风险评估和回撤分析",
                                "策略对比和优化建议"
                            ].map((feature, index) => (
                                <li key={index} className="flex items-center text-gray-700">
                                    <span className="mr-2 text-green-500">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link href="/backtest" className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                            开始回测
                        </Link>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                            <div className="h-8 bg-gray-100 flex items-center px-4 border-b">
                                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                <div className="text-gray-500 text-sm">策略回测</div>
                            </div>
                            <div className="h-64 bg-gray-50 p-4">
                                <div className="h-full rounded bg-white border border-gray-200 p-2 flex flex-col">
                                    <div className="text-sm font-medium text-gray-700 mb-2">策略收益对比</div>
                                    <div className="flex-1 flex items-end">
                                        <div className="w-1/3 h-40 bg-gradient-to-t from-blue-500 to-blue-300 opacity-50 mx-1 rounded-t"></div>
                                        <div className="w-1/3 h-60 bg-gradient-to-t from-green-500 to-green-300 mx-1 rounded-t"></div>
                                        <div className="w-1/3 h-24 bg-gradient-to-t from-red-500 to-red-300 opacity-50 mx-1 rounded-t"></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <div>基准</div>
                                        <div>策略</div>
                                        <div>市场</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white border-t">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">年化收益</div>
                                        <div className="text-green-600 font-semibold">+24.5%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">夏普比率</div>
                                        <div className="font-semibold">1.85</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">最大回撤</div>
                                        <div className="text-red-600 font-semibold">-12.3%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500">胜率</div>
                                        <div className="font-semibold">68%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部号召 */}
            <div className="w-full px-6 py-12 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <div className="container mx-auto max-w-6xl text-center">
                    <h2 className="text-3xl font-bold mb-4">准备开始您的智能交易之旅？</h2>
                    <p className="text-xl mb-8">
                        加入LumosFund，使用AI驱动的交易策略优化您的投资决策。
                    </p>
                    <div className="flex justify-center flex-wrap gap-4">
                        <Link href="/dashboard" className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                            开始使用
                        </Link>
                        <Link href="/learn" className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition">
                            了解更多
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}

function FeatureCard({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) {
    return (
        <Link href={link} className="block p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
        </Link>
    );
}
