/**
 * نظام التحقق من صحة النماذج
 * يحتوي على جميع وظائف التحقق من صحة النماذج مع تقديم ملاحظات فورية
 */

/**
 * تهيئة التحقق من صحة النموذج
 * @param {string} formId - معرف النموذج
 * @param {Object} rules - قواعد التحقق
 */
function initializeFormValidation(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // إضافة مستمعي الأحداث لكل حقل في القواعد
    Object.keys(rules).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
        if (field) {
            // التحقق عند فقدان التركيز
            field.addEventListener('blur', () => {
                validateField(field, rules[fieldName]);
            });
            
            // التحقق عند الكتابة (للملاحظات الفورية)
            field.addEventListener('input', () => {
                // فقط للحقول التي نريد التحقق منها فورياً
                if (rules[fieldName].realTime) {
                    validateField(field, rules[fieldName]);
                }
            });
        }
    });
    
    // التحقق عند إرسال النموذج
    form.addEventListener('submit', function(e) {
        if (!validateForm(form, rules)) {
            e.preventDefault();
        }
    });
}

/**
 * التحقق من صحة حقل محدد
 * @param {HTMLElement} field - الحقل المراد التحقق منه
 * @param {Object} rules - قواعد التحقق للحقل
 * @returns {boolean} true إذا كان الحقل صحيح
 */
function validateField(field, rules) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    
    // إزالة رسائل الخطأ السابقة
    clearFieldError(field);
    
    // التحقق من الحقول المطلوبة
    if (rules.required && !value) {
        showFieldError(field, rules.messages?.required || 'هذا الحقل مطلوب');
        return false;
    }
    
    // إذا كان الحقل فارغًا وغير مطلوب، نعتبره صحيحًا
    if (!value && !rules.required) {
        return true;
    }
    
    // التحقق من الحد الأدنى للأحرف
    if (rules.minLength && value.length < rules.minLength) {
        showFieldError(field, rules.messages?.minLength || `الحد الأدنى هو ${rules.minLength} أحرف`);
        return false;
    }
    
    // التحقق من الحد الأقصى للأحرف
    if (rules.maxLength && value.length > rules.maxLength) {
        showFieldError(field, rules.messages?.maxLength || `الحد الأقصى هو ${rules.maxLength} أحرف`);
        return false;
    }
    
    // التحقق من صيغة البريد الإلكتروني
    if (rules.email && value && !isValidEmail(value)) {
        showFieldError(field, rules.messages?.email || 'يرجى إدخال بريد إلكتروني صحيح');
        return false;
    }
    
    // التحقق من صيغة رقم الهاتف
    if (rules.phone && value && !isValidPhone(value)) {
        showFieldError(field, rules.messages?.phone || 'يرجى إدخال رقم هاتف مصري صحيح');
        return false;
    }
    
    // التحقق من صيغة كلمة المرور
    if (rules.password && value) {
        if (value.length < 6) {
            showFieldError(field, rules.messages?.password || 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return false;
        }
    }
    
    // التحقق من التطابق (مثلاً تأكيد كلمة المرور)
    if (rules.match && value) {
        const matchField = document.getElementById(rules.match) || document.querySelector(`[name="${rules.match}"]`);
        if (matchField && value !== matchField.value) {
            showFieldError(field, rules.messages?.match || 'القيم غير متطابقة');
            return false;
        }
    }
    
    // التحقق من الأرقام
    if (rules.number && value) {
        if (isNaN(value) || value <= 0) {
            showFieldError(field, rules.messages?.number || 'يرجى إدخال رقم صحيح أكبر من صفر');
            return false;
        }
    }
    
    // التحقق من السعر (يمكن أن يكون عشريًا)
    if (rules.price && value) {
        const price = parseFloat(value);
        if (isNaN(price) || price <= 0) {
            showFieldError(field, rules.messages?.price || 'يرجى إدخال سعر صحيح أكبر من صفر');
            return false;
        }
    }
    
    // التحقق من التاريخ
    if (rules.date && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            showFieldError(field, rules.messages?.date || 'يرجى إدخال تاريخ صحيح');
            return false;
        }
    }
    
    // التحقق المخصص
    if (rules.custom && typeof rules.custom === 'function') {
        const customResult = rules.custom(value);
        if (customResult !== true) {
            showFieldError(field, customResult || rules.messages?.custom || 'قيمة غير صحيحة');
            return false;
        }
    }
    
    return true;
}

/**
 * التحقق من صحة النموذج بالكامل
 * @param {HTMLElement} form - عنصر النموذج
 * @param {Object} rules - قواعد التحقق
 * @returns {boolean} true إذا كان النموذج صحيح
 */
function validateForm(form, rules) {
    let isFormValid = true;
    
    // التحقق من كل حقل في القواعد
    Object.keys(rules).forEach(fieldName => {
        const field = form.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);
        if (field) {
            const isFieldValid = validateField(field, rules[fieldName]);
            if (!isFieldValid) {
                isFormValid = false;
            }
        }
    });
    
    // عرض رسالة خطأ عامة إذا لزم الأمر
    if (!isFormValid) {
        showNotification('يرجى تصحيح الأخطاء في النموذج', 'error');
    }
    
    return isFormValid;
}

/**
 * عرض رسالة خطأ لحقل محدد
 * @param {HTMLElement} field - الحقل
 * @param {string} message - رسالة الخطأ
 */
function showFieldError(field, message) {
    // إضافة فئة الخطأ
    field.classList.add('border-red-500');
    field.classList.remove('border-gray-300');
    
    // البحث عن عنصر عرض الخطأ الحالي أو إنشاء واحد جديد
    let errorElement = field.parentNode.querySelector('.field-error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'field-error-message text-red-600 text-sm mt-1';
        field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

/**
 * إزالة رسالة الخطأ من حقل محدد
 * @param {HTMLElement} field - الحقل
 */
function clearFieldError(field) {
    // إزالة فئة الخطأ
    field.classList.remove('border-red-500');
    field.classList.add('border-gray-300');
    
    // إزالة رسالة الخطأ
    const errorElement = field.parentNode.querySelector('.field-error-message');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

/**
 * إزالة جميع رسائل الخطأ من النموذج
 * @param {string} formId - معرف النموذج
 */
function clearFormErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
        clearFieldError(field);
    });
}

/**
 * قواعد التحقق لنموذج تسجيل الدخول
 */
const loginFormRules = {
    username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        realTime: false,
        messages: {
            required: 'يرجى إدخال اسم المستخدم',
            minLength: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
            maxLength: 'اسم المستخدم طويل جداً'
        }
    },
    password: {
        required: true,
        minLength: 6,
        realTime: false,
        messages: {
            required: 'يرجى إدخال كلمة المرور',
            minLength: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        }
    }
};

/**
 * قواعد التحقق لنموذج التسجيل
 */
const registerFormRules = {
    fullName: {
        required: true,
        minLength: 3,
        maxLength: 100,
        realTime: false,
        messages: {
            required: 'يرجى إدخال الاسم الكامل',
            minLength: 'الاسم يجب أن يكون 3 أحرف على الأقل',
            maxLength: 'الاسم طويل جداً'
        }
    },
    username: {
        required: true,
        minLength: 3,
        maxLength: 50,
        realTime: false,
        messages: {
            required: 'يرجى إدخال اسم المستخدم',
            minLength: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل',
            maxLength: 'اسم المستخدم طويل جداً'
        }
    },
    email: {
        required: true,
        email: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال البريد الإلكتروني',
            email: 'يرجى إدخال بريد إلكتروني صحيح'
        }
    },
    phone: {
        required: true,
        phone: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال رقم الهاتف',
            phone: 'يرجى إدخال رقم هاتف مصري صحيح'
        }
    },
    password: {
        required: true,
        minLength: 6,
        realTime: false,
        messages: {
            required: 'يرجى إدخال كلمة المرور',
            minLength: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
        }
    },
    confirmPassword: {
        required: true,
        match: 'password',
        realTime: false,
        messages: {
            required: 'يرجى تأكيد كلمة المرور',
            match: 'كلمات المرور غير متطابقة'
        }
    }
};

/**
 * قواعد التحقق لنموذج إضافة دواء
 */
const addMedicineFormRules = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        realTime: false,
        messages: {
            required: 'يرجى إدخال اسم الدواء',
            minLength: 'اسم الدواء يجب أن يكون حرفين على الأقل',
            maxLength: 'اسم الدواء طويل جداً'
        }
    },
    quantity: {
        required: true,
        number: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال الكمية',
            number: 'يرجى إدخال كمية صحيحة'
        }
    },
    price: {
        required: true,
        price: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال السعر',
            price: 'يرجى إدخال سعر صحيح'
        }
    },
    expiryDate: {
        required: true,
        date: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال تاريخ الانتهاء',
            date: 'يرجى إدخال تاريخ صحيح'
        }
    }
};

/**
 * قواعد التحقق لنموذج إضافة شركة
 */
const addCompanyFormRules = {
    name: {
        required: true,
        minLength: 2,
        maxLength: 100,
        realTime: false,
        messages: {
            required: 'يرجى إدخال اسم الشركة',
            minLength: 'اسم الشركة يجب أن يكون حرفين على الأقل',
            maxLength: 'اسم الشركة طويل جداً'
        }
    },
    email: {
        required: true,
        email: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال البريد الإلكتروني',
            email: 'يرجى إدخال بريد إلكتروني صحيح'
        }
    },
    phone: {
        required: true,
        phone: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال رقم الهاتف',
            phone: 'يرجى إدخال رقم هاتف مصري صحيح'
        }
    }
};


/**
 * قواعد التحقق لنموذج الدفع
 */
const paymentFormRules = {
    orderId: {
        required: true,
        realTime: false,
        messages: {
            required: 'يرجى اختيار الطلب'
        }
    },
    paymentMethod: {
        required: true,
        realTime: false,
        messages: {
            required: 'يرجى اختيار طريقة الدفع'
        }
    },
    amount: {
        required: true,
        price: true,
        realTime: false,
        messages: {
            required: 'يرجى إدخال المبلغ المدفوع',
            price: 'يرجى إدخال مبلغ صحيح'
        }
    }
};

/**
 * تهيئة التحقق من صحة جميع النماذج عند تحميل الصفحة
 */
document.addEventListener('DOMContentLoaded', function() {
    // تهيئة نموذج تسجيل الدخول
    initializeFormValidation('loginForm', loginFormRules);
    
    // تهيئة نموذج التسجيل
    initializeFormValidation('registerForm', registerFormRules);
    
    // تهيئة نموذج إضافة دواء
    initializeFormValidation('addMedicineForm', addMedicineFormRules);
    
    // تهيئة نموذج تعديل دواء
    initializeFormValidation('editMedicineForm', addMedicineFormRules);
    
    // تهيئة نموذج إضافة شركة
    initializeFormValidation('addCompanyForm', addCompanyFormRules);
    
    // تهيئة نموذج تعديل شركة
    initializeFormValidation('editCompanyForm', addCompanyFormRules);
    
    // تهيئة نموذج الدفع
    initializeFormValidation('paymentForm', paymentFormRules);
});

// تصدير الوظائف للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeFormValidation,
        validateField,
        validateForm,
        showFieldError,
        clearFieldError,
        clearFormErrors,
        loginFormRules,
        registerFormRules,
        addMedicineFormRules,
        addCompanyFormRules,
        paymentFormRules
    };
}