/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import IndustrySupervisorLayout from "../layouxt";
import {
  Calendar,
  Users,
  Check,
  X,
  Search,
  Edit,
  UserCheck,
  AlertTriangle,
  Plus,
  Download,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  matricNumber: string;
  department: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attendanceStats: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
    lastAttendance: any;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  present: boolean;
  notes?: string;
  createdAt: string;
  supervisor: {
    id: string;
    name: string;
    email: string;
  };
}

const AttendancePage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState({
    studentId: "",
    date: new Date().toISOString().slice(0, 10),
    present: true,
    notes: "",
  });

  // Fetch students with attendance stats
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/attendance/supervisor/students`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        setError("Failed to fetch students");
      }
    } catch (err) {
      setError("Failed to fetch students");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance records for a specific student
  const fetchAttendanceRecords = async (studentId: string, month?: string) => {
    try {
      const params = new URLSearchParams();
      if (month) params.append("month", month);
      params.append("limit", "100");

      const response = await fetch(
        `${API_BASE_URL}/attendance/${studentId}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.attendance || []);
      } else {
        setError("Failed to fetch attendance records");
      }
    } catch (err) {
      setError("Failed to fetch attendance records");
      console.error("Error:", err);
    }
  };

  // Mark attendance
  const markAttendance = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify(attendanceForm),
      });

      if (response.ok) {
        setShowMarkAttendance(false);
        setAttendanceForm({
          studentId: "",
          date: new Date().toISOString().slice(0, 10),
          present: true,
          notes: "",
        });
        fetchStudents();
        if (selectedStudent) {
          fetchAttendanceRecords(selectedStudent.id, selectedMonth);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark attendance");
      }
    } catch (err) {
      setError("Failed to mark attendance");
      console.error("Error:", err);
    }
  };

  // Filter students
  const filteredStudents = students.filter(
    (student) =>
      student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchAttendanceRecords(selectedStudent.id, selectedMonth);
    }
  }, [selectedStudent, selectedMonth]);

  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <IndustrySupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading attendance data...</p>
          </div>
        </div>
      </IndustrySupervisorLayout>
    );
  }

  return (
    <IndustrySupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Attendance Management
            </h1>
            <p className="text-gray-600">
              Track and manage intern attendance records
            </p>
          </div>
          <button
            onClick={() => setShowMarkAttendance(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Mark Attendance
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Interns ({filteredStudents.length})
                </h3>
              </div>
              <div className="p-6">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search interns..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedStudent?.id === student.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {student.user.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {student.matricNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {student.department}
                          </p>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-lg font-bold ${getAttendanceRateColor(
                              student.attendanceStats.attendanceRate
                            )}`}
                          >
                            {student.attendanceStats.attendanceRate.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {student.attendanceStats.presentDays}/
                            {student.attendanceStats.totalDays} days
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredStudents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm
                      ? "No interns found matching your search"
                      : "No interns assigned yet"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Records */}
          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attendance Records - {selectedStudent.user.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedStudent.matricNumber} •{" "}
                        {selectedStudent.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance Stats */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedStudent.attendanceStats.totalDays}
                      </div>
                      <div className="text-sm text-gray-500">Total Days</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedStudent.attendanceStats.presentDays}
                      </div>
                      <div className="text-sm text-gray-500">Present</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedStudent.attendanceStats.absentDays}
                      </div>
                      <div className="text-sm text-gray-500">Absent</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${getAttendanceRateColor(
                          selectedStudent.attendanceStats.attendanceRate
                        )}`}
                      >
                        {selectedStudent.attendanceStats.attendanceRate.toFixed(
                          1
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-500">Rate</div>
                    </div>
                  </div>
                </div>

                {/* Attendance Records Table */}
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Notes
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatDate(record.date)}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  record.present
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {record.present ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <X className="h-3 w-3" />
                                )}
                                {record.present ? "Present" : "Absent"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-600">
                                {record.notes || "-"}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <Edit className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {attendanceRecords.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No attendance records found for selected month
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Select an intern</p>
                  <p className="text-sm">
                    Choose an intern to view their attendance records
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mark Attendance Modal */}
        {showMarkAttendance && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Mark Attendance
                </h3>
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    value={attendanceForm.studentId}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        studentId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} ({student.matricNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={attendanceForm.date}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={attendanceForm.present === true}
                        onChange={() =>
                          setAttendanceForm({
                            ...attendanceForm,
                            present: true,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-green-700">Present</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={attendanceForm.present === false}
                        onChange={() =>
                          setAttendanceForm({
                            ...attendanceForm,
                            present: false,
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-red-700">Absent</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={attendanceForm.notes}
                    onChange={(e) =>
                      setAttendanceForm({
                        ...attendanceForm,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Add any additional notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMarkAttendance(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={markAttendance}
                  disabled={!attendanceForm.studentId || !attendanceForm.date}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Mark Attendance
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </IndustrySupervisorLayout>
  );
};

export default AttendancePage;
