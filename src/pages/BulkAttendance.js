import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Alert, Button, Col, Form, Row, Table } from "react-bootstrap";

const API = "http://localhost:9999";

//ngày hôm nay theo giờ máy (yyyy-mm-dd), không dùng toISOString vì đó là giờ UTC
function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function BulkAttendance() {
  const { subjectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";

  const [subject, setSubject] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendances, setAttendances] = useState([]);

  const [statuses, setStatuses] = useState({}); //{ studentId: "PRESENT" | "ABSENT" }
  const [date, setDate] = useState(todayString());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showMissing, setShowMissing] = useState(false);

  //tải môn học, các lớp của môn và toàn bộ sinh viên
  useEffect(() => {
    axios
      .get(`${API}/subjects/${subjectId}`)
      .then((res) => setSubject(res.data))
      .catch(() => setError("Subject not found"));
    axios
      .get(`${API}/classes`, { params: { subjectId: subjectId } })
      .then((res) => setClasses(res.data))
      .catch(() => setError("Cannot load classes"));
    axios
      .get(`${API}/students`)
      .then((res) => setStudents(res.data))
      .catch(() => setError("Cannot load students"));
  }, [subjectId]);

  //lớp đang chọn phải thuộc môn này
  const selectedClass = classes.find((c) => c.id === classId);

  //tải điểm danh của lớp đang chọn
  function loadAttendances(id) {
    return axios
      .get(`${API}/attendances`, { params: { classId: id } })
      .then((res) => setAttendances(res.data));
  }

  const selectedClassId = selectedClass ? selectedClass.id : "";

  useEffect(() => {
    setAttendances([]);
    if (selectedClassId === "") return;
    let ignore = false;
    axios
      .get(`${API}/attendances`, { params: { classId: selectedClassId } })
      .then((res) => {
        if (!ignore) setAttendances(res.data);
      })
      .catch(() => setError("Cannot load attendances"));
    return () => {
      ignore = true;
    };
  }, [selectedClassId]);

  //sinh viên đang học (enrolled) của lớp, bỏ sinh viên đã dropped
  const enrolledStudents = selectedClass
    ? selectedClass.enrollments
        .filter((e) => e.status === "enrolled")
        .map((e) => students.find((s) => s.id === e.studentId))
        .filter(Boolean)
    : [];

  function handleClassChange(e) {
    const next = new URLSearchParams(searchParams);
    if (e.target.value === "") {
      next.delete("classId");
    } else {
      next.set("classId", e.target.value);
    }
    setSearchParams(next);
    setStatuses({});
    setError("");
    setSuccess("");
    setShowMissing(false);
  }

  function handleStatusChange(studentId, value) {
    setStatuses({ ...statuses, [studentId]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowMissing(false);

    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }
    if (date === "") {
      setError("Please select a date.");
      return;
    }

    //luật 1: ngày không được ở tương lai (so sánh chuỗi yyyy-mm-dd)
    if (date > todayString()) {
      setError("Date cannot be in the future.");
      return;
    }

    //luật 2: mọi sinh viên phải được chọn trạng thái
    const missing = enrolledStudents.filter((s) => !statuses[s.id]);
    if (missing.length > 0) {
      setError(
        `Please select attendance status for all students (missing: ${missing
          .map((s) => s.studentCode)
          .join(", ")}).`,
      );
      setShowMissing(true);
      return;
    }

    //luật 3: ngày này đã có điểm danh trong lớp
    if (attendances.some((a) => a.date.slice(0, 10) === date)) {
      setError(`Attendance for ${date} already exists in this class.`);
      return;
    }

    //luật 4: hợp lệ, gửi mỗi sinh viên một bản ghi
    try {
      for (const s of enrolledStudents) {
        await axios.post(`${API}/attendances`, {
          studentId: s.id,
          classId: selectedClass.id,
          date: `${date}T00:00:00.000Z`,
          status: statuses[s.id],
        });
      }
      setSuccess(
        `Attendance recorded successfully for ${enrolledStudents.length} student(s) on ${date}.`,
      );
      setStatuses({});
      await loadAttendances(selectedClass.id);
    } catch (err) {
      setError("Failed to record attendance.");
    }
  }

  return (
    <div className="app-card p-4">
      <Row className="mb-3 align-items-end">
        <Col>
          <h2 className="page-title mb-0">Record Attendance</h2>
          {subject && (
            <div className="text-muted">
              {subject.code} — {subject.name}
              {selectedClass && <> | Class: {selectedClass.className}</>}
            </div>
          )}
        </Col>
        <Col md={3}>
          <Form.Group controlId="class">
            <Form.Label className="mb-1 text-muted small">CLASS</Form.Label>
            <Form.Select value={selectedClass ? selectedClass.id : ""} onChange={handleClassChange}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.className}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group controlId="date">
            <Form.Label className="mb-1 text-muted small">SESSION DATE</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">✓ {success}</Alert>}

      {classes.length === 0 && subject && (
        <p className="text-muted">This subject has no classes.</p>
      )}

      {selectedClass && (
        <Form onSubmit={handleSubmit}>
          <Table bordered>
            <thead className="table-primary">
              <tr>
                <th>NO</th>
                <th>STUDENT CODE</th>
                <th>FULL NAME</th>
                <th>ATTENDANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((s, index) => (
                <tr
                  key={s.id}
                  className={showMissing && !statuses[s.id] ? "table-danger" : ""}
                >
                  <td>{index + 1}</td>
                  <td>{s.studentCode}</td>
                  <td>{s.fullName}</td>
                  <td>
                    <Form.Check
                      inline
                      type="radio"
                      id={`present-${s.id}`}
                      name={`status-${s.id}`}
                      label="PRESENT"
                      className="text-success"
                      checked={statuses[s.id] === "PRESENT"}
                      onChange={() => handleStatusChange(s.id, "PRESENT")}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      id={`absent-${s.id}`}
                      name={`status-${s.id}`}
                      label="ABSENT"
                      className="text-danger"
                      checked={statuses[s.id] === "ABSENT"}
                      onChange={() => handleStatusChange(s.id, "ABSENT")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-between align-items-center">
            <Link to="/subjects">← Back to Subjects</Link>
            <Button type="submit" variant="primary">
              Record Attendance
            </Button>
          </div>
        </Form>
      )}

      {!selectedClass && (
        <Link to="/subjects">← Back to Subjects</Link>
      )}
    </div>
  );
}

export default BulkAttendance;
