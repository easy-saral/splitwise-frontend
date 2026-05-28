import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API = 'http://localhost:3000/api';

function App() {
  const [role, setRole] = useState(null); 
  const [view, setView] = useState('login'); 
  const [loginMode, setLoginMode] = useState('shared'); 
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [groupData, setGroupData] = useState({ expenses: [], settlements: [], members: [] });
  const [globalSettlements, setGlobalSettlements] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [groupTab, setGroupTab] = useState('overview'); 

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/auth/login`, {
        username: loginMode === 'admin' ? username : null,
        password
      });
      setRole(res.data.role);
      setView(res.data.role === 'admin' ? 'admin' : 'home');
      fetchCoreData();
    } catch (err) {
      alert("Invalid Credentials");
    }
  };

  const fetchCoreData = async () => {
    const [groupsRes, usersRes] = await Promise.all([
      axios.get(`${API}/groups`),
      axios.get(`${API}/users`)
    ]);
    setGroups(groupsRes.data);
    setUsers(usersRes.data);
  };

  // --- LOGIN SCREEN ---
  if (view === 'login') {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '30px', color: '#1e293b' }}>💸 SplitShare</h1>
          
          <div className="flex-between" style={{ gap: '10px', marginBottom: '25px' }}>
            <button className={`btn ${loginMode === 'shared' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setLoginMode('shared')}>Family</button>
            <button className={`btn ${loginMode === 'admin' ? 'btn-primary' : 'btn-outline'}`} style={{flex: 1}} onClick={() => setLoginMode('admin')}>Admin</button>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column' }}>
            {loginMode === 'admin' && <input className="input-field" type="text" placeholder="Admin Username" value={username} onChange={e => setUsername(e.target.value)} required/>}
            <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required/>
            <button type="submit" className="btn btn-primary" style={{marginTop: '10px'}}>Sign In</button>
          </form>
        </div>
      </div>
    );
  }

  // --- ADMIN PANEL ---
  // --- ADMIN PANEL ---
  if (view === 'admin') {
     const handleCreateUser = async (e) => { e.preventDefault(); await axios.post(`${API}/admin/users`, { name: e.target.name.value }); fetchCoreData(); e.target.reset(); };
     const handleCreateGroup = async (e) => { e.preventDefault(); await axios.post(`${API}/admin/groups`, { name: e.target.gname.value }); fetchCoreData(); e.target.reset(); };
     const handleAddMember = async (e, groupId) => { e.preventDefault(); await axios.post(`${API}/admin/groups/${groupId}/members`, { userId: e.target.user.value }); fetchCoreData(); };
 
 // NEW: Delete Global User
     const handleDeleteUser = async (userId, userName) => {
       if (window.confirm(`Are you sure you want to completely delete ${userName}?`)) {
         try {
           await axios.delete(`${API}/admin/users/${userId}`);
           fetchCoreData(); // Refresh the data if successful!
         } catch (err) {
           console.error("Delete Error:", err);
           alert("Backend Error: Failed to delete user. Did you restart your Node server?");
         }
       }
     };

 // NEW: Remove User from Group
     const handleRemoveMember = async (groupId, userId) => {
       if (window.confirm("Remove this member from the group?")) {
         try {
           await axios.delete(`${API}/admin/groups/${groupId}/members/${userId}`);
           fetchCoreData(); // Refresh the data if successful!
         } catch (err) {
           console.error("Remove Error:", err);
           alert("Backend Error: Failed to remove member. Did you restart your Node server?");
         }
       }
     };

     return (
       <div className="app-container">
         <div className="top-nav">
            <h1>👑 Admin Console</h1>
            <div style={{display: 'flex', gap: '10px'}}>
              <button className="btn btn-outline" onClick={() => setView('home')}>App View</button>
              <button className="btn btn-danger" onClick={() => {setRole(null); setView('login')}}>Log Out</button>
            </div>
         </div>
         
         <div className="grid-2">
           {/* GLOBAL USERS LIST */}
           <div className="card">
             <h3 style={{marginBottom: '15px'}}>👤 Manage Users</h3>
             <form onSubmit={handleCreateUser} className="flex-between" style={{gap: '10px', marginBottom: '20px'}}>
               <input className="input-field" style={{marginBottom: 0}} name="name" placeholder="New User Name" required /> 
               <button type="submit" className="btn btn-primary">+</button>
             </form>
             
             {/* Updated list with Delete buttons */}
             <ul style={{paddingLeft: '0', listStyle: 'none'}}>
               {users.map(u => (
                 <li key={u._id} className="list-item" style={{background: 'white', padding: '10px 15px'}}>
                   <span style={{fontWeight: '500'}}>{u.name}</span>
                   <button className="btn btn-danger" style={{padding: '6px 12px', fontSize: '0.8rem'}} onClick={() => handleDeleteUser(u._id, u.name)}>Delete</button>
                 </li>
               ))}
             </ul>
           </div>
           
           {/* GROUPS LIST */}
           <div className="card">
             <h3 style={{marginBottom: '15px'}}>🏕️ Manage Groups</h3>
             <form onSubmit={handleCreateGroup} className="flex-between" style={{gap: '10px', marginBottom: '20px'}}>
               <input className="input-field" style={{marginBottom: 0}} name="gname" placeholder="New Group Name" required /> 
               <button type="submit" className="btn btn-primary">+</button>
             </form>
             
             {groups.map(g => (
               <div key={g._id} className="list-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                 <h4 style={{margin: '0 0 10px 0', fontSize: '1.1rem'}}>{g.name}</h4>
                 
                 {/* Updated members display with clickable 'x' to remove */}
                 <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px'}}>
                   {g.members.length === 0 && <span style={{fontSize: '0.85rem', color: '#94a3b8'}}>No members yet</span>}
                   {g.members.map(m => (
                     <span key={m._id} className="badge" style={{display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1'}}>
                       {m.name}
                       <span style={{cursor: 'pointer', color: '#ef4444', fontSize: '1.2rem', lineHeight: '0.5'}} onClick={() => handleRemoveMember(g._id, m._id)}>×</span>
                     </span>
                   ))}
                 </div>

                 <form onSubmit={(e) => handleAddMember(e, g._id)} className="flex-between" style={{width: '100%', gap: '10px'}}>
                   <select className="input-field" style={{marginBottom: 0}} name="user">
                     {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                   </select>
                   <button type="submit" className="btn btn-outline">Add</button>
                 </form>
               </div>
             ))}
           </div>
         </div>
       </div>
     );
  }
  // --- HOME VIEW ---
  if (view === 'home') {
    return (
      <div className="app-container">
        <div className="top-nav">
          <h1>👋 Welcome Home</h1>
          <div style={{display: 'flex', gap: '10px'}}>
            {role === 'admin' && <button className="btn btn-outline" onClick={() => setView('admin')}>Admin</button>}
            <button className="btn btn-danger" onClick={() => {setRole(null); setView('login')}}>Log Out</button>
          </div>
        </div>

        <button className="btn btn-primary card-hover" onClick={() => { axios.get(`${API}/global-settlements`).then(res => setGlobalSettlements(res.data)); setView('dashboard'); }} style={{ width: '100%', padding: '20px', fontSize: '1.1rem', marginBottom: '30px' }}>
          📊 View Global Finances Dashboard
        </button>

        <h2 style={{color: '#334155', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px'}}>Your Groups</h2>
        <div className="grid-2">
          {groups.map(g => (
            <div key={g._id} className="card card-hover flex-between" onClick={() => {
                   setActiveGroup(g);
                   setGroupTab('overview'); 
                   axios.get(`${API}/groups/${g._id}/settlements`).then(res => {
                     setGroupData({ expenses: res.data.expenses, settlements: res.data.settlements, members: g.members });
                     setView('group');
                   });
                 }}>
              <h3 style={{margin: 0, color: '#1e293b'}}>{g.name}</h3>
              <span className="badge badge-credit">{g.members.length} Members</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  if (view === 'dashboard') {
    const myDebts = globalSettlements.filter(tx => tx.from === selectedUser);
    const myCredits = globalSettlements.filter(tx => tx.to === selectedUser);
    return (
      <div className="app-container">
        <div className="top-nav">
          <button className="btn btn-outline" onClick={() => setView('home')}>⬅ Back</button>
          <h1 style={{margin: 0}}>Global Finances</h1>
        </div>
        
        <div className="card">
          <label style={{fontWeight: '600', color: '#1e293b', display: 'block', marginBottom: '10px'}}>Select Member to view net balance:</label>
          <select className="input-field" onChange={(e) => setSelectedUser(e.target.value)} style={{marginBottom: 0}}>
            <option value="">-- Select Member --</option>
            {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
          </select>
        </div>

        {selectedUser && (
          <div className="grid-2">
            <div className="card" style={{borderTop: '5px solid #ef4444'}}>
              <h3 style={{color: '#ef4444', marginTop: 0}}>You Owe</h3>
              {myDebts.length === 0 ? <p style={{color: '#475569'}}>You're all clear! 🎉</p> : (
                myDebts.map((tx, i) => <div key={i} className="list-item" style={{background: 'white'}}><strong>${tx.amount}</strong> to {tx.to}</div>)
              )}
            </div>
            <div className="card" style={{borderTop: '5px solid #10b981'}}>
              <h3 style={{color: '#10b981', marginTop: 0}}>You Are Owed</h3>
              {myCredits.length === 0 ? <p style={{color: '#475569'}}>No one owes you. 🕊️</p> : (
                myCredits.map((tx, i) => <div key={i} className="list-item" style={{background: 'white'}}><strong>${tx.amount}</strong> from {tx.from}</div>)
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- GROUP VIEW ---
  if (view === 'group') {
    const handleAddExpense = async (e) => {
      e.preventDefault();
      const amount = parseFloat(e.target.amount.value);
      const split = amount / groupData.members.length;
      const splitDetails = groupData.members.map(m => ({ user: m._id, amountOwed: split }));
      await axios.post(`${API}/expenses`, { groupId: activeGroup._id, description: e.target.desc.value, totalAmount: amount, payer: e.target.payer.value, splitDetails });
      const res = await axios.get(`${API}/groups/${activeGroup._id}/settlements`);
      setGroupData({ ...groupData, expenses: res.data.expenses, settlements: res.data.settlements });
      e.target.reset();
    };

    const handleQuickSettle = async (fromName, toName, amount) => {
      const fromUser = groupData.members.find(m => m.name === fromName);
      const toUser = groupData.members.find(m => m.name === toName);
      await axios.post(`${API}/expenses`, { groupId: activeGroup._id, description: `💸 Settled Up: ${fromName} paid ${toName}`, totalAmount: amount, payer: fromUser._id, isSettlement: true, splitDetails: [{ user: toUser._id, amountOwed: amount }] });
      const res = await axios.get(`${API}/groups/${activeGroup._id}/settlements`);
      setGroupData({ ...groupData, expenses: res.data.expenses, settlements: res.data.settlements });
      setGroupTab('statements'); 
    };

    return (
      <div className="app-container">
        <div className="top-nav">
          <button className="btn btn-outline" onClick={() => setView('home')}>⬅ Home</button>
          <h1>{activeGroup.name}</h1>
        </div>
        
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <button className={`btn-tab ${groupTab === 'overview' ? 'active' : ''}`} onClick={() => setGroupTab('overview')} style={{flex: 1}}>Overview</button>
          <button className={`btn-tab ${groupTab === 'statements' ? 'active' : ''}`} onClick={() => setGroupTab('statements')} style={{flex: 1}}>Statements</button>
        </div>

        {groupTab === 'overview' && (
          <div className="grid-2">
            <div className="card">
              <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>🧾 Add New Bill</h3>
              <form onSubmit={handleAddExpense}>
                <input className="input-field" name="desc" placeholder="What for? (e.g. Dinner)" required />
                <input className="input-field" name="amount" type="number" placeholder="Total Amount ($)" required />
                <select className="input-field" name="payer" required>
                  <option value="">Who paid?</option>
                  {groupData.members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Log Expense</button>
              </form>
            </div>

            <div className="card">
              <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>⚖️ Unsettled Balances</h3>
              {groupData.settlements.length === 0 ? 
                <div style={{textAlign: 'center', padding: '30px', color: '#10b981', fontWeight: 'bold'}}>🎉 Everyone is settled up!</div> 
              : (
                groupData.settlements.map((tx, i) => (
                  <div key={i} className="list-item" style={{background: 'white'}}>
                    <div style={{width: '100%'}}>
                      <div style={{color: '#475569', marginBottom: '5px'}}>
                        <strong style={{ color: '#ef4444' }}>{tx.from}</strong> owes <strong style={{ color: '#10b981' }}>{tx.to}</strong>
                      </div>
                      <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b'}}>${tx.amount}</div>
                    </div>
                    <button className="btn btn-success" onClick={() => handleQuickSettle(tx.from, tx.to, tx.amount)}>Settle Up</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {groupTab === 'statements' && (
          <div className="card">
            <h3 style={{marginTop: 0, marginBottom: '20px', color: '#1e293b'}}>History</h3>
            {groupData.expenses.length === 0 ? <p style={{color: '#475569'}}>No transactions yet.</p> : (
              groupData.expenses.map((exp) => (
                <div key={exp._id} className={`list-item ${exp.isSettlement ? 'statement-payment' : 'statement-bill'}`} style={{flexDirection: 'column', alignItems: 'flex-start'}}>
                  <div className="flex-between" style={{width: '100%', marginBottom: '8px'}}>
                    <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{exp.description}</strong>
                    <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>${exp.totalAmount}</strong>
                  </div>
                  <div className="flex-between" style={{width: '100%', color: '#475569', fontSize: '0.9rem'}}>
                    <span>{exp.isSettlement ? "Settled By" : "Paid By"}: <strong>{exp.payer.name}</strong></span>
                    <span>{new Date(exp.date).toLocaleDateString()} at {new Date(exp.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }
}

export default App;