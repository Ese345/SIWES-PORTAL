import request from 'supertest';
import app from '../index';

describe('Auth Routes', () => {
  let adminToken: string;

  it('should not allow first admin signup', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'admin@example.com',
        name: 'First Admin',
        password: 'AdminPass123',
        role: 'Admin'
      });
    expect(res.status).toBe(403);
    expect(res.body.user).toHaveProperty('email', 'admin@example.com');
  });

  it('should login as admin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123'
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    adminToken = res.body.token;
  });

  it('should change password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        oldPassword: 'AdminPass123',
        newPassword: 'NewAdminPass123'
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Password changed successfully');
  });

  it('should logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});