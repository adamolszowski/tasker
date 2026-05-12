import React, { useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Table from "react-bootstrap/Table";
import Form from "react-bootstrap/Form";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import Stack from "react-bootstrap/Stack";

const API_URL = "http://localhost:5000";

const ROLE_OPTIONS =[
     { value: "pracownik", label: "Pracownik"},
      { value: "kierownik", label: "Kierownik"},
       { value: "administrator", label: "Administrator"},
];

function AdminRolesPage({ authToken, authenticatedUser}) {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [activeUsers, setActiveUsers] = useState([]);

    const [pendingRoleDrafts, setPendingRoleDrafts] = useState({});
    const [activeRoleDrafts, setActiveRoleDrafts] = useState({});

    const [isPendingLoading, setIsPendingLoading]= useState(true);
    const [isActiveLoading, setIsActiveLoading] = useState(true);

    const [isSubmittingPendingId, setIsSubmittingPendingId] = useState(null);
    const [isChangingRoleId , setIsChangingRoleId]= useState(null);
    const [isRevokingRoleId , setIsRevokingRoleId]= useState(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const isAdmin = authenticatedUser?.role === "administrator";
    const isSuperadmin = authenticatedUser?.role === "superadmin";
    const canAccessPage = isAdmin || isSuperadmin;

    const resetMessages = () => {
        setErrorMessage("");
        setSuccessMessage("");
    };
    
    const getUserFullName = (user) => {
     const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || "-";   
    };

    const getRoleLabel = (roleName) => {
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
};

const canManageActiveUser =(targetUser) => {
   if (!authenticatedUser || !targetUser) {
    return false;
   }

    if (authenticatedUser.id === targetUser.id) {
    return false;
   }

    if (targetUser.role_name ==="superadmin") {
    return false;
   }

    if (authenticatedUser.role === "superadmin") {
    return true;
   }

if (authenticatedUser.role === "administrator") {
    return (
        targetUser.role_name !== "administrator" &&
        targetUser.role_name !== "superadmin"
    );
}

  return false;
};

const fetchPendingUsers = async () => {
    if (!authToken) {
        setIsPendingLoading(false);
        return;
    }

    try {
        setIsPendingLoading(true);

        const response = await fetch(`${API_URL}/api/admin/pending-users`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            setErrorMessage(
               data.message || "Nie udało się pobrać użytkowników oczekujących."
            );
            setPendingUsers([]);
            return;
        }

        setPendingUsers(data.users || []);
    }catch (error) {
        setErrorMessage("Nie udało się połączyć z backendem.");
        setPendingUsers([]);
    } finally {
        setIsPendingLoading(false);
    }
};

const fetchActiveUsers = async ()=> {
    if(!authToken) {
        setIsActiveLoading(false);
        return;
    }

    try {
    setIsActiveLoading(true);

    const response = await fetch(`${API_URL}/api/admin/active-users`,{
        method: "GET",
        headers: {
            Authorization: `Bearer ${authToken}`,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        setErrorMessage(
data.message || "Nie udało się pobrać aktywnych użytkowników."
        );
    setActiveUsers([]);
    return;
    }

    setActiveUsers(data.users || []);
} catch (error) {
    setErrorMessage("Nie udało się połączyć z backendem.");
    setActiveUsers([]);
} finally {
    setIsActiveLoading(false);
  }
};

const refreshAll = async () => {
    resetMessages();

    if (isSuperadmin) {
        await Promise.all([fetchPendingUsers(), fetchActiveUsers()]);
        return;
    }

    await fetchActiveUsers();
};

useEffect(() => {
    if (!canAccessPage) {
        setIsPendingLoading(false);
        setIsActiveLoading(false);
        return;
    }

    if (isSuperadmin) {
        refreshAll();
        return;
    }

    setPendingUsers([]);
    setIsPendingLoading(false);
    fetchActiveUsers();
}, [authToken, authenticatedUser?.role]);

const handlePendingRoleChange = (userId, role) => {
    setPendingRoleDrafts((prev) => ({
        ...prev,
        [userId]: role,
    }));
};

const handleActiveRoleChange = (userId, role) => {
    setActiveRoleDrafts((prev) => ({
        ...prev,
        [userId]: role,
    }));
};

const handleApproveRole = async (userId) => {
    const selectedRole = pendingRoleDrafts[userId];

    if (!selectedRole) {
        setErrorMessage("Najpierw wybierz rolę dla użytkownika.");
        setSuccessMessage("");
       return;
    }
    
    try {
        setIsSubmittingPendingId(userId);
        resetMessages();

           const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/approve-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok){ 
        setErrorMessage(
            data.message || "Nie udało się nadać roli użytkownikowi."
        );
        return;
      }

      setSuccessMessage(data.message || "Rola została nadana użytkownikowi.");

      setPendingUsers((prev) => prev.filter((user) => user.id !== userId));

      setPendingRoleDrafts((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      await fetchActiveUsers();
    } catch (error) {
        setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
        setIsSubmittingPendingId(null);
    }
};

const handleChangeRole = async (userId) => {
    const selectedRole =activeRoleDrafts[userId];
    
    if (!selectedRole) {
        setErrorMessage("Najpierw wybierz nową rolę.");
      setSuccessMessage("");
      return;
    }

    try {
        setIsChangingRoleId(userId);
        resetMessages();

        const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/change-role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            role: selectedRole,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się zmienić roli użytkownika."
        );
        return;
      }

       setSuccessMessage(data.message || "Rola użytkownika została zmieniona.");

      setActiveRoleDrafts((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });

      await fetchActiveUsers();
      await fetchPendingUsers();
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      setIsChangingRoleId(null);
    }
  };

  const handleRevokeRole = async (userId) => {
    try {
      setIsRevokingRoleId(userId);
      resetMessages();

      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/revoke-role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(
          data.message || "Nie udało się odebrać roli użytkownikowi."
        );
        return;
      }

      setSuccessMessage(data.message || "Rola została odebrana użytkownikowi.");

      await fetchActiveUsers();
      await fetchPendingUsers();
    } catch (error) {
      setErrorMessage("Nie udało się połączyć z backendem.");
    } finally {
      setIsRevokingRoleId(null);
    }
  };

  if (!authenticatedUser) {
    return (
       <Alert variant="warning">
         Musisz być zalogowany , aby wejść do zarządzania rolami.
       </Alert>
    );
  }

  if (!canAccessPage) {
    return (
       <Alert variant="danger">
        Ten widok jest dostępny tylko dla administratora  i superadministratora.
       </Alert>
    );
  }

  return(
<div>
     <Card className="mb-4 border">
        <Card.Body>
           <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                 <h2 className="mb-1">ZARZĄDZANIE ROLAMI</h2>
                 <p className="text-muted mb-0">
                    Nadawanie,zmiana i odbieranie ról użytkownikom systemu
                 </p>
              </div>

              <Stack direction="horizontal" gap={2}>
                  <Badge bg="light" text="dark" className="border px-3 py-2">
                    Oczekujący: {pendingUsers.length}
                  </Badge>
                  <Badge bg="light" text="dark" className="border px-3 py-2">
                    Aktywni: {activeUsers.length}
                  </Badge>
                  <Button variant="outline-dark" onClick={refreshAll}>
                    Odśwież
                  </Button>
              </Stack>
            </div>    
        </Card.Body>
       </Card>

         {errorMessage && (
            <Alert variant="danger" className="mb-3">
                {errorMessage}
                </Alert>
         )}

         {successMessage && (
            <Alert variant="success" className="mb-3">
                {successMessage}
            </Alert>
         )}

         <Card className="mb-4 border">
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Użytkowników oczekujący na aktywację</h4>
                    <Badge bg="light" text="dark" className="border">
                        {pendingUsers.length}
                    </Badge>
                </div>

                {!isSuperadmin ? (
                    <Alert variant="info" className="mb-0">
                        Aktywacja nowych kont i pierwsze nadawanie ról jest dostępne tylko dla
                         superadministratora.
                    </Alert>
                    ): isPendingLoading ? (
                        <div className="text-center py-4">
                            <Spinner className="me-2" />
                               Ładowanie użytkowników oczekujących...
                        </div>
                    ): pendingUsers.length ===0 ? (
                        <Alert variant="secondary" className="mb-0">
                            Brak użytkowników oczekujących na nadanie roli.
                        </Alert>
                    ) : (
                <Table responsive hover className="mb-0 align-middle">
                    <thead>
                       <tr>
                           <th>ID</th>
                           <th>Login</th>
                           <th>Imię  i  nazwisko</th>
                           <th>E-mail</th>
                           <th>Telefon</th>
                           <th>Nowa rola</th>
                           <th>Akcja</th>
                       </tr>
                    </thead>
                    <tbody>
                        {pendingUsers.map((user) => (
                           <tr key={user.id}>
                               <td>{user.id}</td>
                               <td>{user.login}</td>
                               <td>{getUserFullName(user)}</td>
                               <td>{user.email || "-"}</td>
                                <td>{user.phone || "-"}</td>
                                <td style={{ minWidth: "200px"}}>
                                    <Form.Select
                                       value={pendingRoleDrafts[user.id] || ""}
                                       onChange={(event) =>
                                        handlePendingRoleChange(user.id, event.target.value)
                                       }
                                        disabled={isSubmittingPendingId === user.id}
                                        >
                                            <option value="">Wybierz rolę...</option>
                                            {ROLE_OPTIONS.map((roleOption) => (
                                                <option 
                                                  key={roleOption.value}
                                                  value={roleOption.value}
                                                  >
                                                    {roleOption.label}
                                                  </option>
                                            ))}
                                            </Form.Select>
                                </td>
                                <td>
                                    <Button
                                     variant="dark"
                                     onClick={() => handleApproveRole(user.id)}
                                     disabled={isSubmittingPendingId === user.id}
                                     >
                                        {isSubmittingPendingId ===user.id ? (
                                            <>
                                            <Spinner size="sm" className="me-2" />
                                            Zatwierdzanie...
                                            </>
                                        ) : (
                                            "Nadaj rolę"
                                        )}
                                    </Button>
                                </td>
                               </tr>
                        ))}
                    </tbody>
                </Table>
                    )}
                </Card.Body> 
             </Card> 

            <Card className="border">
                <Card.Body>
                   <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="mb-0">Aktywni użytkownicy</h4>
                     <Badge bg="light" text="dark" className="border">
                        {activeUsers.length}
                     </Badge>
                   </div>

                   {isActiveLoading ? (
                    <div>
                        <Spinner className="me-2" />
                        Ładowanie aktywnych użytkowników...
                    </div>
                   ) : activeUsers.length === 0 ? (
                    <Alert variant="secondary" className="mb-0">
                        Brak aktywnych użytkowników.
                    </Alert>
                   ) : (
                    <Table responsive hover className="mb-0 align-middle">
                                  <thead>
                                    <tr>
                                      <th>ID</th>
                                      <th>Login</th>
                                      <th>Imię i nazwisko</th>
                                      <th>E-mail</th>
                                      <th>Telefon</th>
                                      <th>Obecna rola</th>
                                      <th>Nowa rola</th>
                                      <th>Akcje</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeUsers.map((user) => {
                                      const canManage = canManageActiveUser(user);
                    
                                      return (
                                        <tr key={user.id}>
                                          <td>{user.id}</td>
                                          <td>{user.login}</td>
                                          <td>{getUserFullName(user)}</td>
                                          <td>{user.email || "-"}</td>
                                          <td>{user.phone || "-"}</td>
                                          <td>
                                            <Badge bg="light" text="dark" className="border">
                                              {getRoleLabel(user.role_name)}
                                            </Badge>
                                          </td>
                                          <td style={{ minWidth: "220px" }}>
                                            <Form.Select
                                              value={activeRoleDrafts[user.id] || ""}
                                              onChange={(event) =>
                                                handleActiveRoleChange(user.id, event.target.value)
                                              }
                                              disabled={
                                                !canManage ||
                                                isChangingRoleId === user.id ||
                                                isRevokingRoleId === user.id
                                              }
                                            >
                                              <option value="">Wybierz nową rolę...</option>
                                              {ROLE_OPTIONS.map((roleOption) => (
                                                <option
                                                  key={roleOption.value}
                                                  value={roleOption.value}
                                                >
                                                  {roleOption.label}
                                                </option>
                                              ))}
                                              </Form.Select>
                                              </td>
                                              <td>
                                                 {canManage ? (
                                                    <Stack direction="horizontal" gap={2}>
                                                        <Button
                                                        variant="outline-dark"
                                                        onClick={() => handleChangeRole(user.id)}
                                                        disabled={
                                                            isChangingRoleId === user.id ||
                                                            isRevokingRoleId === user.id
                                                        }
                                                        >
                                                        {isChangingRoleId === user.id ? (
                                                            <>
                                                            <Spinner size="sm" className="me-2" />
                                                            Zmiana...
                                                          </>
                                                        ) : (
                                                            "Zmień rolę"
                                                        )}
                                                    </Button>

                                                    <Button
                                                    variant="outline-danger"
                                                    onClick={() => handleRevokeRole(user.id)}
                                                    disabled={
                                                        isChangingRoleId === user.id ||
                                                        isRevokingRoleId === user.id
                                                    }
                                                    >
                                                         {isRevokingRoleId === user.id ? (
                                                            <>
                                                            <Spinner size="sm" className="me-2" />
                                                            Odbieranie...
                                                          </>
                                                        ) : (
                                                            "Odbierz rolę"
                                                        )}
                                                    </Button>
                                                    </Stack>
                                                 ) : (
                                                    <span className="text-muted small">
                                                        Brak uprawnień
                                                    </span>
                                                 )}
                                              </td>
                                            </tr>
                                      );
                                    })}
                                    </tbody>     
                                </Table>
                   )}
                   </Card.Body>
                   </Card>
                   </div>
  );
}

export default AdminRolesPage;