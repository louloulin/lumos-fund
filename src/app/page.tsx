import Link from 'next/link';
import { FaRobot, FaChartLine, FaSearchDollar, FaBriefcase, FaArrowRight, FaUserAlt } from 'react-icons/fa';

// 顶部导航组件
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md dark:bg-black/50 z-50 border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-indigo-600 text-white h-8 w-8 rounded-md flex items-center justify-center font-bold">LF</div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">LumosFund</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
            >
              文档
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
            >
              定价
            </Link>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
            >
              <FaUserAlt className="mr-2" />
              登录
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center">
            {/* 导航栏 */}
            <Navbar />
            
            {/* 顶部横幅 */}
            <div className="w-full px-6 py-24 mt-16 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <div className="container mx-auto max-w-6xl">
                    <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
                        AI驱动的量化<br />投资新体验
                    </h1>
                    <h2 className="text-xl sm:text-2xl font-light mb-8 max-w-2xl">
                        LumosFund AI将前沿人工智能与金融分析相结合，让投资决策更智能、更高效
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/dashboard" className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold flex items-center hover:bg-gray-100 transition">
                            开始使用 <FaArrowRight className="ml-2" />
                        </Link>
                        <Link href="/dashboard/trading?tab=backtest" className="px-6 py-3 bg-indigo-700 text-white rounded-lg font-semibold flex items-center hover:bg-indigo-800 transition border border-indigo-400">
                            回测策略
                        </Link>
                    </div>
                </div>
            </div>

            {/* 主要功能展示 */}
            <div className="container mx-auto max-w-6xl px-6 py-20">
                <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">强大的AI交易助手</h2>

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
            <div className="w-full bg-gray-50 dark:bg-gray-900 py-20">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-full md:w-1/2 mb-8 md:mb-0">
                            <h2 className="text-3xl font-bold mb-6">认识您的AI交易助手</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                                LumosFund AI助手是一个基于先进大语言模型的交易代理，能够理解复杂的金融概念和市场动态。它不仅能分析大量的市场数据，还可以执行交易策略和优化投资组合。
                            </p>
                            <ul className="space-y-3">
                                {[
                                    "实时市场分析与洞察",
                                    "多策略交易执行与跟踪",
                                    "自动投资组合优化与再平衡",
                                    "风险管理与风险预警",
                                    "个性化投资建议"
                                ].map((feature, index) => (
                                    <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                                        <span className="mr-2 text-green-500 text-lg">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/ai-agent" className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                                了解更多
                            </Link>
                        </div>
                        <div className="w-full md:w-1/2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl">
                            <div className="h-64 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-lg flex items-center justify-center">
                                <div className="text-center p-6">
                                    <FaRobot className="text-6xl text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold mb-2">LumosFund AI</h3>
                                    <p className="text-gray-600 dark:text-gray-400">基于Mastra框架打造的新一代AI交易助手</p>
                                </div>
                            </div>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-gray-700 dark:text-gray-300 italic">
                                    "我的目标是帮助您做出更明智的投资决策，提供及时的市场分析和专业的投资建议，同时根据您的风险偏好优化投资组合。"
                                </p>
                                <p className="mt-2 text-right text-sm text-gray-500 dark:text-gray-400">— LumosFund AI</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 回测系统介绍 */}
            <div className="container mx-auto max-w-6xl px-6 py-20">
                <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="w-full md:w-1/2 mb-8 md:mb-0">
                        <h2 className="text-3xl font-bold mb-6">强大的策略回测系统</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                            使用我们的回测系统，您可以在实际投资前测试和验证各种交易策略的表现。系统支持多种策略模型，包括价值投资、技术分析、情绪分析和混合策略。
                        </p>
                        <ul className="space-y-3">
                            {[
                                "多种策略模型支持",
                                "详细的绩效指标分析",
                                "交易记录和权益曲线",
                                "风险评估和回撤分析",
                                "策略对比和优化建议"
                            ].map((feature, index) => (
                                <li key={index} className="flex items-center text-gray-700 dark:text-gray-300">
                                    <span className="mr-2 text-green-500 text-lg">✓</span>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Link href="/dashboard/trading?tab=backtest" className="inline-block mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">
                            开始回测
                        </Link>
                    </div>
                    <div className="w-full md:w-1/2">
                        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden">
                            <div className="h-8 bg-gray-100 dark:bg-gray-700 flex items-center px-4 border-b dark:border-gray-600">
                                <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                                <div className="text-gray-500 dark:text-gray-400 text-sm">策略回测</div>
                            </div>
                            <div className="h-64 bg-gray-50 dark:bg-gray-900 p-4">
                                <div className="h-full rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 flex flex-col">
                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">策略收益对比</div>
                                    <div className="flex-1 flex items-end">
                                        <div className="w-1/3 h-40 bg-gradient-to-t from-blue-500 to-blue-300 opacity-50 mx-1 rounded-t"></div>
                                        <div className="w-1/3 h-60 bg-gradient-to-t from-green-500 to-green-300 mx-1 rounded-t"></div>
                                        <div className="w-1/3 h-24 bg-gradient-to-t from-red-500 to-red-300 opacity-50 mx-1 rounded-t"></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <div>基准</div>
                                        <div>策略</div>
                                        <div>市场</div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">年化收益</div>
                                        <div className="text-green-600 dark:text-green-500 font-semibold">+24.5%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">夏普比率</div>
                                        <div className="font-semibold dark:text-white">1.85</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">最大回撤</div>
                                        <div className="text-red-600 dark:text-red-500 font-semibold">-12.3%</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-gray-400">胜率</div>
                                        <div className="font-semibold dark:text-white">68%</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部号召 */}
            <div className="w-full px-6 py-16 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
                <div className="container mx-auto max-w-6xl text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">准备开始您的智能交易之旅？</h2>
                    <p className="text-xl mb-8 max-w-3xl mx-auto">
                        加入LumosFund，使用AI驱动的交易策略优化您的投资决策。
                    </p>
                    <div className="flex justify-center flex-wrap gap-4">
                        <Link href="/dashboard" className="px-8 py-4 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition">
                            开始使用
                        </Link>
                        <Link href="/learn" className="px-8 py-4 bg-indigo-700 text-white rounded-lg font-semibold hover:bg-indigo-800 transition border border-indigo-400">
                            了解更多
                        </Link>
                    </div>
                </div>
            </div>

            {/* 页脚 */}
            <footer className="w-full bg-gray-50 dark:bg-gray-900 py-12">
                <div className="container mx-auto max-w-6xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="bg-indigo-600 text-white h-8 w-8 rounded-md flex items-center justify-center font-bold">LF</div>
                                <span className="text-xl font-bold">LumosFund</span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                AI驱动的下一代投资平台，让每个人都能获得专业的投资建议。
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">产品</h3>
                            <ul className="space-y-2">
                                {["AI交易助手", "技术分析", "基本面分析", "投资组合"].map((item, i) => (
                                    <li key={i}>
                                        <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">资源</h3>
                            <ul className="space-y-2">
                                {["文档", "学习中心", "API", "社区"].map((item, i) => (
                                    <li key={i}>
                                        <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">公司</h3>
                            <ul className="space-y-2">
                                {["关于我们", "博客", "职业机会", "联系我们"].map((item, i) => (
                                    <li key={i}>
                                        <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm">
                                            {item}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-gray-600 dark:text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} LumosFund. 保留所有权利。
                    </div>
                </div>
            </footer>
        </main>
    );
}

function FeatureCard({ icon, title, description, link }: { icon: React.ReactNode, title: string, description: string, link: string }) {
    return (
        <Link href={link} className="block p-8 bg-white dark:bg-gray-800 shadow-lg rounded-xl hover:shadow-xl transition border border-gray-100 dark:border-gray-700">
            <div className="mb-4">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-3">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{description}</p>
        </Link>
    );
}
