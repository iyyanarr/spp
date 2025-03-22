import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { 
  Clock, AlertTriangle, CheckCircle, Loader, BarChart2, PieChart as PieChartIcon, 
  TrendingUp, TrendingDown, RefreshCw, Filter, Download, Calendar 
} from "lucide-react";

const Dashboard: React.FC = () => {
  // Dashboard state
  const [timeframe, setTimeframe] = useState<'day'|'week'|'month'>('week');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  
  // Simulated dashboard data
  // Production KPIs
  const kpiData = {
    day: {
      totalProduction: 1245,
      rejectionRate: 3.2,
      efficiency: 92.7,
      downtime: 24
    },
    week: {
      totalProduction: 8750,
      rejectionRate: 2.8,
      efficiency: 94.3,
      downtime: 168
    },
    month: {
      totalProduction: 37500,
      rejectionRate: 2.5,
      efficiency: 95.1,
      downtime: 720
    }
  };
  
  // Process performance data
  const processPerformance = {
    day: [
      { name: 'Post Curing', completed: 420, pending: 30, rejected: 15 },
      { name: 'OD Trimming', completed: 395, pending: 45, rejected: 10 },
      { name: 'Inspection', completed: 430, pending: 25, rejected: 12 }
    ],
    week: [
      { name: 'Post Curing', completed: 2950, pending: 180, rejected: 95 },
      { name: 'OD Trimming', completed: 2820, pending: 210, rejected: 85 },
      { name: 'Inspection', completed: 2980, pending: 150, rejected: 75 }
    ],
    month: [
      { name: 'Post Curing', completed: 12500, pending: 750, rejected: 350 },
      { name: 'OD Trimming', completed: 12100, pending: 900, rejected: 380 },
      { name: 'Inspection', completed: 12900, pending: 600, rejected: 320 }
    ]
  };
  
  // Rejection reasons data
  const rejectionReasons = [
    { name: 'Tool Mark', value: 35 },
    { name: 'Bonding Failure', value: 25 },
    { name: 'Over Trim', value: 15 },
    { name: 'Thread Issue', value: 12 },
    { name: 'Other Defects', value: 13 }
  ];
  
  // Production trends over time
  const productionTrends = {
    day: [
      { time: '6:00', postCuring: 45, odTrimming: 40, inspection: 42 },
      { time: '8:00', postCuring: 55, odTrimming: 45, inspection: 50 },
      { time: '10:00', postCuring: 65, odTrimming: 60, inspection: 62 },
      { time: '12:00', postCuring: 50, odTrimming: 45, inspection: 48 },
      { time: '14:00', postCuring: 70, odTrimming: 65, inspection: 67 },
      { time: '16:00', postCuring: 75, odTrimming: 70, inspection: 72 },
      { time: '18:00', postCuring: 60, odTrimming: 55, inspection: 58 }
    ],
    week: [
      { time: 'Mon', postCuring: 420, odTrimming: 395, inspection: 430 },
      { time: 'Tue', postCuring: 450, odTrimming: 425, inspection: 460 },
      { time: 'Wed', postCuring: 480, odTrimming: 455, inspection: 490 },
      { time: 'Thu', postCuring: 465, odTrimming: 440, inspection: 475 },
      { time: 'Fri', postCuring: 500, odTrimming: 475, inspection: 510 },
      { time: 'Sat', postCuring: 380, odTrimming: 360, inspection: 390 },
      { time: 'Sun', postCuring: 255, odTrimming: 240, inspection: 265 }
    ],
    month: [
      { time: 'Week 1', postCuring: 2950, odTrimming: 2820, inspection: 2980 },
      { time: 'Week 2', postCuring: 3100, odTrimming: 2950, inspection: 3150 },
      { time: 'Week 3', postCuring: 3200, odTrimming: 3050, inspection: 3250 },
      { time: 'Week 4', postCuring: 3250, odTrimming: 3100, inspection: 3300 }
    ]
  };
  
  // Recent activities
  const recentActivities = [
    { id: 1, time: '15:45', process: 'Post Curing', batch: 'PC-2403-089', status: 'Completed', quantity: 250 },
    { id: 2, time: '15:30', process: 'OD Trimming', batch: 'OD-2403-076', status: 'In Progress', quantity: 180 },
    { id: 3, time: '15:15', process: 'Inspection', batch: 'INS-2403-104', status: 'Completed', quantity: 300 },
    { id: 4, time: '15:00', process: 'Post Curing', batch: 'PC-2403-088', status: 'Completed', quantity: 275 },
    { id: 5, time: '14:45', process: 'OD Trimming', batch: 'OD-2403-075', status: 'Completed', quantity: 220 }
  ];
  
  // Top operators
  const topOperators = [
    { id: 1, name: 'John Smith', process: 'Post Curing', completedToday: 530, efficiency: 98.2 },
    { id: 2, name: 'Emma Johnson', process: 'OD Trimming', completedToday: 495, efficiency: 97.5 },
    { id: 3, name: 'Michael Brown', process: 'Inspection', completedToday: 550, efficiency: 99.1 },
    { id: 4, name: 'Sarah Davis', process: 'Post Curing', completedToday: 510, efficiency: 96.8 },
    { id: 5, name: 'Robert Wilson', process: 'OD Trimming', completedToday: 485, efficiency: 95.9 }
  ];
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Refresh dashboard data
  const refreshData = () => {
    setIsRefreshing(true);
    // Simulate API call delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  useEffect(() => {
    // Initial data fetch
    refreshData();
  }, [timeframe]);
  
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 md:mb-0">Manufacturing Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <button 
              className={`px-4 py-2 text-sm font-medium ${timeframe === 'day' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setTimeframe('day')}
            >
              Day
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${timeframe === 'week' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setTimeframe('week')}
            >
              Week
            </button>
            <button 
              className={`px-4 py-2 text-sm font-medium ${timeframe === 'month' ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              onClick={() => setTimeframe('month')}
            >
              Month
            </button>
          </div>
          
          {/* Process filter */}
          <select 
            className="py-2 px-3 rounded-lg border border-slate-200 bg-white shadow-sm text-sm"
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
          >
            <option value="all">All Processes</option>
            <option value="post-curing">Post Curing</option>
            <option value="od-trimming">OD Trimming</option>
            <option value="inspection">Inspection</option>
          </select>
          
          {/* Refresh button */}
          <button 
            className="flex items-center gap-2 bg-white py-2 px-4 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          {/* Export button */}
          <button className="flex items-center gap-2 bg-white py-2 px-4 rounded-lg border border-slate-200 shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Production */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Production</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{kpiData[timeframe].totalProduction.toLocaleString()}</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +5.2% from previous {timeframe}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <BarChart2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Target: {(kpiData[timeframe].totalProduction * 1.1).toLocaleString()} units</p>
          </div>
        </div>
        
        {/* Rejection Rate */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Rejection Rate</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{kpiData[timeframe].rejectionRate}%</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingDown className="h-4 w-4 mr-1" />
                -0.3% from previous {timeframe}
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Target: Below 2.5%</p>
          </div>
        </div>
        
        {/* Efficiency */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Efficiency</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{kpiData[timeframe].efficiency}%</h3>
              <p className="text-sm text-green-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +1.8% from previous {timeframe}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Target: Above 95%</p>
          </div>
        </div>
        
        {/* Downtime */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Downtime</p>
              <h3 className="text-2xl font-bold mt-1 text-slate-800">{kpiData[timeframe].downtime} min</h3>
              <p className="text-sm text-red-600 flex items-center mt-1">
                <TrendingUp className="h-4 w-4 mr-1" />
                +12.5% from previous {timeframe}
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Target: Below 20 min/day</p>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Production Trends Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800">Production Trends</h3>
            <div className="flex items-center text-xs text-slate-500">
              <div className="flex items-center mr-3">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                Post Curing
              </div>
              <div className="flex items-center mr-3">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                OD Trimming
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-amber-500 rounded-full mr-1"></span>
                Inspection
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productionTrends[timeframe]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="postCuring" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="odTrimming" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="inspection" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Process Performance Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-slate-800">Process Performance</h3>
            <div className="flex items-center text-xs text-slate-500">
              <div className="flex items-center mr-3">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                Completed
              </div>
              <div className="flex items-center mr-3">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
                Pending
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                Rejected
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processPerformance[timeframe]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill="#10b981" />
                <Bar dataKey="pending" stackId="a" fill="#3b82f6" />
                <Bar dataKey="rejected" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Rejection Reasons */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Rejection Reasons</h3>
          <div className="h-64 flex justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rejectionReasons}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {rejectionReasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Recent Activities</h3>
          <div className="overflow-y-auto max-h-64">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Process</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">{activity.time}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{activity.process}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{activity.batch}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Completed' 
                          ? 'bg-green-100 text-green-800' 
                          : activity.status === 'In Progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {activity.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top Operators */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="text-lg font-medium text-slate-800 mb-4">Top Operators</h3>
          <div className="overflow-y-auto max-h-64">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Process</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Completed</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topOperators.map((operator) => (
                  <tr key={operator.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{operator.name}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-500">{operator.process}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-700">{operator.completedToday}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="text-green-600 font-medium">{operator.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Pending Tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-800">Pending Tasks</h3>
          <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Process</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Start Time</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Est. Completion</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-700">PC-2403-090</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">Post Curing</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">280</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">16:00</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">16:45</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">Pending</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <button>Start Process</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-700">OD-2403-077</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">OD Trimming</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">195</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">16:15</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">17:00</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">In Progress</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <button>View Details</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-slate-700">INS-2403-105</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">Inspection</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">320</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">16:30</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-slate-500">17:15</td>
                <td className="px-3 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full">Scheduled</span>
                </td>
                <td className="px-3 py-4 whitespace-nowrap text-sm text-blue-600 hover:text-blue-800 font-medium">
                  <button>Start Process</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Interactive Quicklinks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-blue-800">Post Curing</h3>
              <p className="text-sm text-blue-600 mt-1">Track and manage post curing operations</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <button className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-900">
            Go to Post Curing →
          </button>
        </div>
        
        <div className="bg-green-50 rounded-xl shadow-sm border border-green-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-green-800">OD Trimming</h3>
              <p className="text-sm text-green-600 mt-1">Monitor OD trimming processes</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <BarChart2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <button className="mt-4 text-sm font-medium text-green-700 hover:text-green-900">
            Go to OD Trimming →
          </button>
        </div>
        
        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-100 p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-amber-800">Inspection</h3>
              <p className="text-sm text-amber-600 mt-1">View and create inspection entries</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <button className="mt-4 text-sm font-medium text-amber-700 hover:text-amber-900">
            Go to Inspection →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;