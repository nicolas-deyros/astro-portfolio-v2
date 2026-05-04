export interface LinkData {
	id: number
	title: string
	url: string
	tags: string
	date: string
}

export interface FormValues {
	name: string
	email: string
	message: string
}

export type FormErrors = Partial<Record<keyof FormValues, string>>

const emailRules =
	/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

export function validateContactForm(values: FormValues): FormErrors {
	const errors: FormErrors = {}

	if (!values.name) {
		errors.name = 'Name is a required field and cannot be empty'
	} else if (values.name.length < 4) {
		errors.name = 'Name must be at least 4 characters long'
	} else if (values.name.length > 50) {
		errors.name = 'Name must be no longer than 50 characters'
	} else if (!/^[áéíóúÁÉÍÓÚñÑa-zA-Z ]+$/.test(values.name)) {
		errors.name = 'Name must only contain letters and spaces'
	}

	if (!values.email) {
		errors.email = 'Email is a required field and cannot be empty'
	} else if (!emailRules.test(values.email)) {
		errors.email = 'Please enter a valid email'
	}

	if (values.message && values.message.length < 10) {
		errors.message = 'Message must be at least 10 characters long'
	}

	return errors
}
