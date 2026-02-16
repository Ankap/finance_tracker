import React, { useState } from 'react';
import { Upload, TrendingUp, Target, FileText, Check, Sparkles } from 'lucide-react';
import { assetsAPI, goalsAPI, statementsAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const UpdateData = () => {
  const [activeTab, setActiveTab] = useState('assets');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Asset form state
  const [assetForm, setAssetForm] = useState({
    name: 'Mutual Funds',
    currentValue: '',
    returnPercentage: '',
    owner: 'Joint',
  });

  // Goal review state
  const [goalProgress, setGoalProgress] = useState({
    goalId: '',
    amount: '',
  });

  // Statement upload state
  const [statementUpload, setStatementUpload] = useState({
    file: null,
    account: 'Joint',
    statementType: 'Bank Statement',
    startDate: '',
    endDate: '',
  });

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      // Find existing asset or create new one
      const assetsResponse = await assetsAPI.getAll();
      const existingAsset = assetsResponse.data.find(
        (a) => a.name === assetForm.name && a.owner === assetForm.owner
      );

      if (existingAsset) {
        // Add snapshot to existing asset
        await assetsAPI.addSnapshot(existingAsset._id, {
          value: parseFloat(assetForm.currentValue),
          returnPercentage: parseFloat(assetForm.returnPercentage),
        });
      } else {
        // Create new asset
        await assetsAPI.create({
          name: assetForm.name,
          currentValue: parseFloat(assetForm.currentValue),
          owner: assetForm.owner,
        });
      }

      setSuccess(true);
      setAssetForm({
        name: 'Mutual Funds',
        currentValue: '',
        returnPercentage: '',
        owner: 'Joint',
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Error updating asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatementUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('statement', statementUpload.file);
      formData.append('account', statementUpload.account);
      formData.append('statementType', statementUpload.statementType);
      formData.append('startDate', statementUpload.startDate);
      formData.append('endDate', statementUpload.endDate);

      const response = await statementsAPI.upload(formData);
      
      // Auto-process the statement
      await statementsAPI.process(response.data.statement._id);

      setSuccess(true);
      setStatementUpload({
        file: null,
        account: 'Joint',
        statementType: 'Bank Statement',
        startDate: '',
        endDate: '',
      });

      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading statement:', error);
      alert('Error uploading statement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Update Data</h2>
        <p className="text-gray-500 mt-1">Keep your financial data current</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'assets'
              ? 'text-sage-700 border-b-2 border-sage-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={20} />
            <span>Update Assets</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'goals'
              ? 'text-sage-700 border-b-2 border-sage-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Target size={20} />
            <span>Review Goals</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('statements')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'statements'
              ? 'text-sage-700 border-b-2 border-sage-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <span>Upload Statements</span>
          </div>
        </button>
      </div>

      {/* Update Assets Tab */}
      {activeTab === 'assets' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Update Assets</h3>
          </div>

          <form onSubmit={handleUpdateAsset} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asset Type
                </label>
                <select
                  value={assetForm.name}
                  onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Mutual Funds">Mutual Funds</option>
                  <option value="Stocks">Stocks</option>
                  <option value="EPF">EPF</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Fixed Deposits">Fixed Deposits</option>
                  <option value="Bank Savings">Bank Savings</option>
                  <option value="House">House</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner
                </label>
                <select
                  value={assetForm.owner}
                  onChange={(e) => setAssetForm({ ...assetForm, owner: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="Joint">Joint</option>
                  <option value="Anurag">Anurag</option>
                  <option value="Nidhi">Nidhi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Value (₹)
                </label>
                <input
                  type="number"
                  value={assetForm.currentValue}
                  onChange={(e) => setAssetForm({ ...assetForm, currentValue: e.target.value })}
                  className="input-field"
                  placeholder="425000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return % (since last update)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={assetForm.returnPercentage}
                  onChange={(e) =>
                    setAssetForm({ ...assetForm, returnPercentage: e.target.value })
                  }
                  className="input-field"
                  placeholder="12.5"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    <span>Update Asset</span>
                  </>
                )}
              </button>

              {success && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check size={20} />
                  <span className="font-medium">Asset updated successfully!</span>
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 p-4 bg-sage-50 rounded-lg border border-sage-100">
            <div className="flex items-start gap-3">
              <Sparkles className="text-sage-600 mt-1" size={20} />
              <div>
                <p className="font-medium text-gray-900 mb-1">Tip</p>
                <p className="text-sm text-gray-600">
                  Update your assets monthly to track growth. Return percentage is automatically
                  calculated from the change in value since your last update.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Goals Tab */}
      {activeTab === 'goals' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Review Goals</h3>
          </div>

          <div className="text-center py-12">
            <Target className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 mb-2">
              Goal progress is updated automatically based on your asset values
            </p>
            <p className="text-sm text-gray-500">
              Go to the Goals page to view detailed progress
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Emergency Fund</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">₹5.19L</span>
                <span className="text-green-600 text-sm">Goal ₹5.19L</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">New Home</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">₹8.5L</span>
                <span className="text-gray-600 text-sm">Goal ₹8L</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '106%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Travel Fund</p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">₹7L</span>
                <span className="text-gray-600 text-sm">Goal ₹5L</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: '140%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Statements Tab */}
      {activeTab === 'statements' && (
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="text-sage-600" size={24} />
            <h3 className="text-xl font-semibold text-gray-900">Upload Statements</h3>
          </div>

          <form onSubmit={handleStatementUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account
                </label>
                <select
                  value={statementUpload.account}
                  onChange={(e) =>
                    setStatementUpload({ ...statementUpload, account: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="Joint">Joint</option>
                  <option value="Anurag">Anurag</option>
                  <option value="Nidhi">Nidhi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statement Type
                </label>
                <select
                  value={statementUpload.statementType}
                  onChange={(e) =>
                    setStatementUpload({ ...statementUpload, statementType: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Paytm">Paytm</option>
                  <option value="CSV">CSV File</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={statementUpload.startDate}
                  onChange={(e) =>
                    setStatementUpload({ ...statementUpload, startDate: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={statementUpload.endDate}
                  onChange={(e) =>
                    setStatementUpload({ ...statementUpload, endDate: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File (PDF or CSV)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-sage-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-sage-600 hover:text-sage-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf,.csv"
                        onChange={(e) =>
                          setStatementUpload({ ...statementUpload, file: e.target.files[0] })
                        }
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF or CSV up to 10MB</p>
                  {statementUpload.file && (
                    <p className="text-sm text-sage-600 font-medium mt-2">
                      {statementUpload.file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    <span>Upload & Process</span>
                  </>
                )}
              </button>

              {success && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check size={20} />
                  <span className="font-medium">Statement uploaded successfully!</span>
                </div>
              )}
            </div>
          </form>

          <div className="mt-8 space-y-3">
            <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Added ₹1,10,000 this Fixed Deposits</span>
              </p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <Check className="text-green-600" size={20} />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Emergency Fund reached to 25% milestone</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Review */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-sage-600" size={24} />
          <h3 className="text-xl font-semibold text-gray-900">AI Review</h3>
        </div>

        <div className="space-y-3">
          <div className="p-4 bg-sage-50 rounded-lg">
            <p className="text-gray-700">
              You added the most to your fixed deposits this month.
            </p>
          </div>

          <div className="p-4 bg-sage-50 rounded-lg">
            <p className="text-gray-700">
              The emergency fund hit an important milestone too.
            </p>
          </div>
        </div>

        <button className="mt-6 w-full btn-primary">Done</button>
      </div>
    </div>
  );
};

export default UpdateData;
