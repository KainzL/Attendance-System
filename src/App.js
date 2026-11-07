import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { Container, Nav, Navbar } from "react-bootstrap";
import SubjectList from "./pages/SubjectList";
import BulkAttendance from "./pages/BulkAttendance";

function App() {
  return (
    <BrowserRouter>
      <Navbar variant="dark" className="app-navbar mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/subjects">
            Attendance System
          </Navbar.Brand>
          <Nav>
            <Nav.Link as={Link} to="/subjects">
              Subjects
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        <Routes>
          <Route path="/" element={<Navigate to="/subjects" replace />} />
          <Route path="/subjects" element={<SubjectList />} />
          <Route
            path="/subjects/:subjectId/attendance"
            element={<BulkAttendance />}
          />
          <Route path="*" element={<Navigate to="/subjects" replace />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}

export default App;
