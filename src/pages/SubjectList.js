import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { Alert, Badge, Button, Card, Col, Form, Row } from "react-bootstrap";

const API = "http://localhost:9999";

function SubjectList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    axios
      .get(`${API}/subjects`)
      .then((res) => setSubjects(res.data))
      .catch(() => setError("Cannot load subjects, please run json-server"));
  }, []);

  //các trạng thái lấy từ dữ liệu, loại bỏ trùng (không viết cứng)
  const statuses = [...new Set(subjects.map((s) => s.status))];

  //trạng thái đang chọn đọc từ URL (?status=ACTIVE), không hợp lệ thì coi là All
  const statusParam = (searchParams.get("status") || "").toUpperCase();
  const status = statuses.includes(statusParam) ? statusParam : "";

  function handleStatusChange(e) {
    const next = new URLSearchParams(searchParams);
    if (e.target.value === "") {
      next.delete("status");
    } else {
      next.set("status", e.target.value);
    }
    setSearchParams(next);
  }

  //lọc ở client: tên bắt đầu bằng từ khóa (không phân biệt hoa thường) + trạng thái
  const text = keyword.trim();
  const displaySubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().startsWith(text.toLowerCase()) &&
      (status === "" || s.status === status),
  );

  return (
    <div>
      <h2 className="page-title">Subject List</h2>
      <p className="text-muted">Browse and filter available subjects</p>

      <div className="app-card p-3 mb-3">
        <Row className="g-2">
          <Col>
            <Form.Control
              type="text"
              placeholder="Search by name..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Col>
          <Col md="auto">
            <Form.Select value={status} onChange={handleStatusChange}>
              <option value="">All Status</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <p className="text-muted small">
        Showing <strong>{displaySubjects.length}</strong> of{" "}
        <strong>{subjects.length}</strong> subjects
        {text !== "" && (
          <>
            {" "}
            matching <em>"{text}"</em>
          </>
        )}
        {status !== "" && (
          <>
            {" "}
            with status <strong>{status}</strong>
          </>
        )}
      </p>

      {displaySubjects.length === 0 && !error && <p>No subjects found.</p>}

      <Row xs={1} sm={2} md={4} className="g-3">
        {displaySubjects.map((s) => (
          <Col key={s.id}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>{s.code}</Card.Title>
                <Card.Text className="mb-1">{s.name}</Card.Text>
                <Card.Text className="text-muted small">
                  Credits: {s.credits}
                </Card.Text>
                <div className="d-flex align-items-center justify-content-between">
                  <Badge
                    bg={s.status === "ACTIVE" ? "success-subtle" : "secondary-subtle"}
                    text={s.status === "ACTIVE" ? "success-emphasis" : "secondary-emphasis"}
                  >
                    {s.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => navigate(`/subjects/${s.id}/attendance`)}
                  >
                    View Attendance
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

export default SubjectList;
