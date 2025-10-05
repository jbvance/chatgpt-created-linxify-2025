import RegisterPage from '@/components/RegisterUser';

export default function Page() {
  const allowRegistration = process.env.ALLOW_NEW_USERS || '';
  return <RegisterPage allowRegistration={allowRegistration} />;
}
