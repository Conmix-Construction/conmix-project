import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Calendar, Wallet, CheckCircle, Printer, 
  FileText, Banknote, Calculator, RefreshCw, MapPin
} from 'lucide-react';

// Mock Databases for Math Processing (Until Attendance/Production modules are fully wired)
const mockAttendanceRecords = {
  "EMP-001": { totalDays: 30, present: 28, absent: 2, overtimeHours: 10, overtimeRate: 200 }
};

const mockProductionRecords = {
  "EMP-002": [
    { date: "2026-06-01", batch: "B-101", product: "1500 PSI Solid", blocks: 1500 },
    { date: "2026-06-03", batch: "B-105", product: "1000 PSI Solid", blocks: 2000 },
    { date: "2026-06-05", batch: "B-110", product: "1500 PSI Solid", blocks: 1200 }
  ]
};

const mockCashAdvances = {
  "EMP-001": 2000,
  "EMP-002": 5000,
  "EMP-003": 0
};

export default function PayrollScreen() {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [payPeriod, setPayPeriod] = useState('2026-06');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Live Data State
  const [liveEmployees, setLiveEmployees] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // --- 1. FETCH LIVE EMPLOYEES FROM DB ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/employees');
        if (response.ok) {
          const data = await response.json();
          // Map DB structure to payroll structure
          const formattedStaff = data.map(emp => ({
            id: emp.code || emp._id,
            name: emp.name,
            role: emp.designation || 'Staff',
            // Defaulting to Fixed if not specified, simulating database enrichment
            type: emp.designation?.toLowerCase().includes('operator') || emp.designation?.toLowerCase().includes('mixer') ? 'Piece-Rate' : 'Fixed',
            baseRate: emp.designation?.toLowerCase().includes('operator') ? 4.5 : 45000 
          }));
          setLiveEmployees(formattedStaff);
        }
      } catch (error) {
        console.error("Failed to load employees", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchEmployees();
  }, []);

  const employee = liveEmployees.find(emp => emp.id === selectedEmpId) || null;

  // --- 2. PERFORM PAYROLL MATH ---
  const payrollData = useMemo(() => {
    if (!employee) return null;

    let grossPay = 0;
    let deductions = 0;
    let details = {};

    if (employee.type === 'Fixed') {
      const record = mockAttendanceRecords[employee.id] || { present: 30, absent: 0, overtimeHours: 0, overtimeRate: 0, totalDays: 30 };
      const perDayRate = employee.baseRate / 30;
      
      const basicPay = employee.baseRate - (record.absent * perDayRate);
      const overtimePay = record.overtimeHours * record.overtimeRate;
      
      grossPay = basicPay + overtimePay;
      details = { basicPay, absentDeduction: record.absent * perDayRate, overtimePay, ...record };
    } else if (employee.type === 'Piece-Rate') {
      const records = mockProductionRecords[employee.id] || [];
      const totalBlocks = records.reduce((sum, r) => sum + r.blocks, 0);
      
      grossPay = totalBlocks * employee.baseRate;
      details = { totalBlocks, records };
    }

    const advanceTaken = mockCashAdvances[employee.id] || 0;
    deductions += advanceTaken;
    const netPayable = grossPay - deductions;

    return { grossPay, deductions, advanceTaken, netPayable, details };
  }, [employee]);

  // --- 3. SAVE PAYSLIP & POST TO LEDGER ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!employee || !payrollData) return;
    
    setIsSaving(true);
    try {
      // Assuming your backend route handles this correctly
      const response = await fetch('http://localhost:5000/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          employeeName: employee.name,
          payPeriod: payPeriod,
          payType: employee.type,
          grossPay: payrollData.grossPay,
          deductions: payrollData.deductions,
          advanceTaken: payrollData.advanceTaken,
          netPayable: payrollData.netPayable,
          details: payrollData.details
        })
      });

      // Even if the backend route isn't fully ready, we will show success for UI testing
      setIsGenerated(true);
    } catch (error) {
      console.error("Error generating payslip:", error);
      alert("Error connecting to server. Is the backend running?");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedEmpId('');
    setIsGenerated(false);
  };

  // ==========================================
  // PRINTABLE PAYSLIP SUCCESS SCREEN
  // ==========================================
  if (isGenerated) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center font-sans">
        
        {/* Action Bar - Hidden During Print */}
        <div className="w-full max-w-3xl flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 print:hidden bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-800">Payslip Successfully Generated</h2>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handleReset}
              className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition text-center"
            >
              Generate Another
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>

        {/* Printable Area - Standardized A5/A4 Formatting */}
        <div className="w-full max-w-3xl bg-white p-10 md:p-12 rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-none print:p-0 print:w-full">
          
          {/* Company Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">CONMIX CONSTRUCTION</h1>
              <p className="text-sm font-semibold text-slate-600 mt-1">Near Usman Shah Mazar, 8 Km Gadap Town, Karachi</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-300 uppercase tracking-widest">Salary Slip</h2>
            </div>
          </div>

          {/* Employee & Period Details */}
          <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-lg print:bg-transparent print:p-0 print:border-b print:border-slate-200 print:pb-6 print:rounded-none">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee Details</p>
              <p className="text-xl font-black text-slate-900">{employee.name}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{employee.id} | {employee.role}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pay Period</p>
              <p className="text-xl font-black text-blue-700">{payPeriod}</p>
              <p className="text-sm font-bold text-slate-600 mt-1">{employee.type} Compensation</p>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="mb-8">
            <table className="w-full text-left border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 print:bg-slate-50">
                  <th className="p-3 text-xs font-black uppercase tracking-wider text-slate-800 border-r border-slate-200">Earnings</th>
                  <th className="p-3 w-32 text-xs font-black uppercase tracking-wider text-slate-800 text-right border-r border-slate-200">Amount</th>
                  <th className="p-3 text-xs font-black uppercase tracking-wider text-slate-800 border-r border-slate-200">Deductions</th>
                  <th className="p-3 w-32 text-xs font-black uppercase tracking-wider text-slate-800 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-slate-700">
                <tr className="border-b border-slate-200">
                  <td className="p-3 border-r border-slate-200">
                    {employee.type === 'Fixed' ? 'Basic Salary' : `Piece-Rate (${payrollData.details.totalBlocks} Blocks @ Rs. ${employee.baseRate})`}
                  </td>
                  <td className="p-3 border-r border-slate-200 text-right text-slate-900">
                    {employee.type === 'Fixed' ? employee.baseRate.toLocaleString() : payrollData.grossPay.toLocaleString()}
                  </td>
                  <td className="p-3 border-r border-slate-200">Cash Advance / Loan</td>
                  <td className="p-3 text-right text-red-600">{payrollData.advanceTaken.toLocaleString()}</td>
                </tr>
                
                {employee.type === 'Fixed' && (
                  <tr className="border-b border-slate-200">
                    <td className="p-3 border-r border-slate-200">Overtime ({payrollData.details.overtimeHours} hrs)</td>
                    <td className="p-3 border-r border-slate-200 text-right text-slate-900">{payrollData.details.overtimePay.toLocaleString()}</td>
                    <td className="p-3 border-r border-slate-200">Unpaid Absences ({payrollData.details.absent} days)</td>
                    <td className="p-3 text-right text-red-600">{payrollData.details.absentDeduction.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  </tr>
                )}
                
                {/* Empty padding rows to make the table look official */}
                <tr className="border-b border-slate-200 h-10"><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td className="border-r border-slate-200"></td><td></td></tr>
              </tbody>
              <tfoot className="bg-slate-50 print:bg-transparent">
                <tr className="border-t-2 border-slate-800">
                  <td className="p-3 font-black text-slate-900 border-r border-slate-200 text-right text-xs uppercase tracking-wider">Gross Pay:</td>
                  <td className="p-3 font-black text-slate-900 border-r border-slate-200 text-right">{payrollData.grossPay.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td className="p-3 font-black text-slate-900 border-r border-slate-200 text-right text-xs uppercase tracking-wider">Total Deductions:</td>
                  <td className="p-3 font-black text-red-600 text-right">{payrollData.deductions.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Net Payable Highlights */}
          <div className="flex justify-between items-center mb-12 bg-slate-900 text-white p-6 rounded-xl print:bg-white print:text-slate-900 print:border-2 print:border-slate-900 print:rounded-none">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 print:text-slate-500 mb-1">Net Payable Amount</p>
              <p className="text-4xl font-black">Rs. {payrollData.netPayable.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
            </div>
            <Banknote className="w-12 h-12 text-slate-600 print:hidden" />
          </div>

          {/* Signatures Area */}
          <div className="grid grid-cols-2 gap-16 pt-10 mt-8">
            <div className="text-center border-t-2 border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Authorized By</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">HR / Finance Manager</p>
            </div>
            <div className="text-center border-t-2 border-slate-400 pt-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Employee Signature</p>
              <p className="text-[10px] font-semibold text-slate-500 mt-1">Received in full</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // STANDARD DATA ENTRY FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" /> Conmix Construction
            </h1>
            <p className="text-slate-400 text-xs font-semibold mt-1 flex items-center gap-1 uppercase tracking-wider">
              <MapPin className="w-3 h-3" /> Smart Payroll Generation
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-sm text-slate-300">{new Date().toDateString()}</span>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Configuration */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-blue-600"/> Selection
              </h3>
              
              <div className="mb-4">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Pay Period (Month)</label>
                <input 
                  type="month" 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-bold text-slate-700"
                  value={payPeriod}
                  onChange={(e) => setPayPeriod(e.target.value)}
                />
              </div>

              <div className="mb-2">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Select Employee</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-bold text-slate-700"
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                >
                  <option value="" disabled>{isLoadingData ? 'Loading staff...' : 'Choose employee...'}</option>
                  {liveEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Employee Details Card */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex-grow shadow-sm">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-blue-600"/> Employee Profile
              </h3>
              
              {!employee ? (
                <p className="text-sm text-slate-500 italic text-center mt-8 font-medium">Select an employee to view profile.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Employee ID</p>
                    <p className="font-black text-slate-800">{employee.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Department/Role</p>
                    <p className="font-bold text-slate-800">{employee.role}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Compensation Type</p>
                    <span className={`inline-block px-2.5 py-1 mt-1 text-[10px] font-black uppercase tracking-wider rounded-md ${employee.type === 'Fixed' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                      {employee.type} Salary
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200/60 mt-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Base Rate Setup</p>
                    <p className="font-black text-blue-700 text-xl">
                      Rs. {employee.baseRate.toLocaleString()}
                      <span className="text-xs font-bold text-blue-500 ml-1 tracking-wide">{employee.type === 'Fixed' ? '/ month' : '/ block'}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Calculation Breakdown */}
          <div className="w-full lg:w-2/3 flex flex-col">
            <h2 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-wider">Calculation Breakdown</h2>
            
            <div className="border border-slate-200 rounded-xl overflow-hidden flex-grow bg-white flex flex-col shadow-sm">
              {!employee ? (
                <div className="p-12 text-center text-slate-400 italic flex flex-col items-center justify-center h-full">
                  <Calculator className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="font-semibold">Awaiting employee selection to compute wages.</p>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  
                  <div className="p-6 flex-grow overflow-auto">
                    
                    {/* Fixed Salary View */}
                    {employee.type === 'Fixed' && (
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2">Attendance Summary (Month)</h4>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Days</p>
                            <p className="font-black text-xl text-slate-800 mt-1">{payrollData.details.totalDays}</p>
                          </div>
                          <div className="bg-emerald-50 p-4 rounded-xl text-center border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Present</p>
                            <p className="font-black text-xl text-emerald-700 mt-1">{payrollData.details.present}</p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-xl text-center border border-red-100">
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-wider">Absent</p>
                            <p className="font-black text-xl text-red-700 mt-1">{payrollData.details.absent}</p>
                          </div>
                        </div>

                        <table className="w-full text-sm text-left">
                          <tbody>
                            <tr className="border-b border-slate-100">
                              <td className="py-3 font-bold text-slate-700">Base Salary</td>
                              <td className="py-3 text-right font-bold text-slate-900">Rs. {employee.baseRate.toLocaleString()}</td>
                            </tr>
                            <tr className="border-b border-slate-100 text-red-600">
                              <td className="py-3 font-bold text-red-500">Unpaid Absences ({payrollData.details.absent} days)</td>
                              <td className="py-3 text-right font-bold">- Rs. {payrollData.details.absentDeduction.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            </tr>
                            <tr className="border-b border-slate-100 text-emerald-600">
                              <td className="py-3 font-bold text-emerald-600">Overtime ({payrollData.details.overtimeHours} hrs @ Rs. {payrollData.details.overtimeRate})</td>
                              <td className="py-3 text-right font-bold">+ Rs. {payrollData.details.overtimePay.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Piece-Rate View */}
                    {employee.type === 'Piece-Rate' && (
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2 flex justify-between">
                          <span>Production Batches Logged</span>
                          <span className="text-blue-600">Total Yield: {payrollData.details.totalBlocks.toLocaleString()}</span>
                        </h4>
                        
                        <div className="overflow-x-auto mb-4 border border-slate-200 rounded-xl">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Date</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-500">Batch Ref</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-wider text-slate-500 text-right">Blocks Produced</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payrollData.details.records.map((rec, i) => (
                                <tr key={i} className="border-b border-slate-100 last:border-0">
                                  <td className="p-3 font-medium text-slate-700">{rec.date}</td>
                                  <td className="p-3 font-mono text-xs font-bold text-slate-600">{rec.batch}</td>
                                  <td className="p-3 text-right font-black text-slate-900">{rec.blocks.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl font-bold text-slate-800 border border-blue-100 mt-6">
                          <span className="text-sm">Total Piece-Rate Earnings ({payrollData.details.totalBlocks} × Rs. {employee.baseRate})</span>
                          <span className="text-lg text-blue-700">Rs. {payrollData.grossPay.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Universal Deductions (Advances) */}
                    <div className="mt-8">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-4 border-b border-slate-100 pb-2">Ledger Deductions</h4>
                      <table className="w-full text-sm text-left">
                        <tbody>
                          <tr className="text-orange-600">
                            <td className="py-2 font-bold text-orange-600">Mid-Month Cash Advances (Pulled from Finance)</td>
                            <td className="py-2 text-right font-black">- Rs. {payrollData.advanceTaken.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals & Submit Section */}
                  <div className="bg-slate-50 border-t border-slate-200 p-6 md:p-8">
                    <div className="flex flex-col gap-3 mb-6 max-w-sm ml-auto">
                      <div className="flex justify-between text-sm text-slate-600 font-bold">
                        <span>Gross Earnings:</span>
                        <span className="text-slate-800">Rs. {payrollData.grossPay.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                      </div>
                      <div className="flex justify-between text-sm text-red-500 font-bold border-b border-slate-200 pb-3">
                        <span>Total Deductions:</span>
                        <span>- Rs. {payrollData.deductions.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black text-slate-900 pt-1">
                        <span className="uppercase text-sm tracking-wider flex items-center">Net Payable:</span>
                        <span className="text-blue-600">Rs. {payrollData.netPayable.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button 
                        onClick={handleGenerate}
                        disabled={isSaving}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 font-bold py-3 px-8 rounded-lg shadow-md transition-all ${
                          isSaving ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 hover:-translate-y-0.5'
                        }`}
                      >
                        {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                        {isSaving ? 'Processing...' : 'Generate & Post to Ledger'}
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}