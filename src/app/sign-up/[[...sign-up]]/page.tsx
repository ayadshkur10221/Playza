import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <SignUp appearance={{ elements: { rootBox: 'mx-auto' } }} />
    </div>
  )
}