import { Check, Sparkles } from 'lucide-react';

const UpdateDataScreen = () => {

  const tasks = [
    {
      title: 'Update Assets',
      subtitle: 'Added ₹1,10,000 this Fixed Deposits',
      status: 'compared',
      completed: true
    },
    {
      title: 'Review Goals',
      subtitle: 'Emergency Fund reased to 25% milestone',
      status: 'progress',
      completed: true
    },
    {
      title: 'Upload Statements',
      subtitle: 'Total spend by this month: ₹70,000',
      status: 'Required PDF @ statement',
      completed: true
    }
  ];

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        {/* Page title */}
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Update Data</h1>

        {/* Task List */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 mb-6 shadow-sm">
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <div key={index} className="flex items-start gap-4 py-3">
                <div className={`mt-1 w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                  task.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}>
                  {task.completed && <Check className="text-white" size={16} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                  <p className="text-sm text-gray-600">{task.subtitle}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    {task.status}
                    {task.status === 'compared' && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Review */}
        <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Sparkles className="text-teal-600" size={20} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">AI Review</h3>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
              <p className="text-gray-700">
                You added the most d your fixed deposite this month.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-teal-600 mt-1 flex-shrink-0">•</span>
              <p className="text-gray-700">
                The emergency fund hit an important milestone too.
              </p>
            </div>
          </div>

          <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateDataScreen;
