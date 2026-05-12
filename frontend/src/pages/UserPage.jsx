import React, { useEffect, useMemo, useState } from "react";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

const API_URL = "http://localhost:5000";

function getRoleLabel(roleName) {
    switch (roleName) {
        case "pracownik":
            return "Pracownik";
        case "kierownik":
            return "Kierownik";
        case "administrator":
            return "Administrator";
        case "superadmin":
            return "Superadministrator";
        default:
            return "Brak roli";                            
    }
}

function getFullName(user) {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || "-";
}

function UsersPage({ authToken, authenticatedUser}) {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    

useEffect(() =>{
    const fetchUsers = async () => {
        if (!authToken) {
            setErrorMessage("Brak tokenu autoryzacji.");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setErrorMessage("");

            const response = await fetch(`${API_URL}/api/users`,{
                method: "GET",
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });
            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(
                    data.message || "Nie udało się pobrać listy użytkowników."
                );
                setUsers([]);
                return;
            }

            setUsers(data.users || []);
            } catch (error) {
                setErrorMessage("Nie udało się połączyć z backendem,");
                setUsers([]);            
            } finally {
                setIsLoading(false);
            }
        };

        if (authenticatedUser) {
            fetchUsers();
        } else {
            setIsLoading(false);
        }
    }, [authToken, authenticatedUser]);

    const filteredUsers = useMemo(()=> {
     const query = searchTerm.trim().toLowerCase();

     if (!query) {
        return users;
     }

     return users.filter((user) => {
        const fullName = getFullName(user).toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = (user.phone || "").toLowerCase();
        const role = getRoleLabel(user.role_name).toLowerCase();
        
        return (
            fullName.includes(query) ||
            email.includes(query) ||
            phone.includes(query) ||
            role.includes(query) 
        );
           });
    }, [users, searchTerm]);

    if (!authenticatedUser) {
        return (
            <Alert variant="warning">
                Musisz być zalogowany, aby zobaczyć listę użytkowników.
            </Alert>
        );
    }

    return(
        <div>
            <Card className="mb-4 border">
                 <Card.Body>
                    <h2 className="mb-1">UŻYTKOWNICY</h2>
                    <p className="text-muted mb-4">
                        Lista użytkowników systemu i ich podstawowe dane
                    </p>

                    <Form.Control
                      style={{ maxWidth: "360px"}}
                      type="text"
                      placeholder="Szukaj użytkownika..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      />
                      </Card.Body>
                    </Card>

                    {errorMessage && (
                        <Alert variant="danger">{errorMessage}</Alert>
                    )}

                    {isLoading ? (
                        <Card className="border">
                            <Card.Body className="text-center py-4">
                               <Spinner className="me-2" />
                            Ładowanie użytkowników...
                            </Card.Body>
                        </Card>
                    ) : filteredUsers.length === 0 ? (
                        <Alert variant="secondary">
                            Brak użytkowników do wyświetlenia.
                        </Alert>
                    ) : (
                        <Card className="border">
                            <Card.Body className="p-0">
                                <Table responsive hover className="mb-0 align-middle">
                                    <thead>
                                        <tr>
                                            <th>Imię i nazwisko</th>
                                            <th>E-mail</th>
                                            <th>Telefon</th>
                                            <th>Rola</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map((user) =>(
                                           <tr key={user.id}>
                                               <td>{getFullName(user)}</td>
                                               <td>{user.email || "-"}</td>
                                                <td>{user.phone || "-"}</td>
                                                <td>
                                                    <Badge bg="light" text="dark" className="border">
                                                        {getRoleLabel(user.role_name)}
                                                    </Badge>
                                                </td>
                                           </tr>                                                                     
                                    ))}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}
        </div>
    );
}

export default UsersPage;