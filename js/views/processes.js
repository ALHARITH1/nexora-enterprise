window.NEXORA = window.NEXORA || {};

NEXORA.Views = NEXORA.Views || {};

var PMBOK_GROUPS = [
  { id: 'initiating', name: 'بدء', nameEn: 'Initiating', icon: 'ti ti-rocket', color: '#7c3aed' },
  { id: 'planning', name: 'تخطيط', nameEn: 'Planning', icon: 'ti ti-pencil', color: '#2563EB' },
  { id: 'executing', name: 'تنفيذ', nameEn: 'Executing', icon: 'ti ti-player-play', color: '#22C55E' },
  { id: 'monitoring', name: 'متابعة وتحكم', nameEn: 'Monitoring & Controlling', icon: 'ti ti-chart-line', color: '#F59E0B' },
  { id: 'closing', name: 'إغلاق', nameEn: 'Closing', icon: 'ti ti-flag', color: '#EF4444' }
];

var PMBOK_CATALOG = [
  { id:'P1', name:'إعداد ميثاق المشروع', group:'بدء', groupEn:'Initiating', tier:2, icon:'📋', desc:'إنشاء وثيقة رسمية تمنح صلاحيات رسمية لمدير المشروع وتحدد الأهداف الرئيسية والمتطلبات الأولية للمشروع', inputs:['طلب تقديم الخدمة','دراسة الجدوى الأولية','اتفاقية الشراكة','عقد المشاركة'], outputs:['ميثاق المشروع','سجل أصحاب المصلحة الأولي'], construction:'إعداد ميثاق مشروع بناء يشمل وصف المشروع وأهدافه وميزانيته الأولية وصلاحيات مدير المشروع أمام العميل والمقاولين' },
  { id:'P2', name:'تحديد أصحاب المصلحة', group:'بدء', groupEn:'Initiating', tier:2, icon:'👥', desc:'تحديد وتوثيق جميع الأطراف المعنية بالمشروع وتحليل احتياجاتهم وتوقعاتهم وتأثيرهم على المشروع', inputs:['ميثاق المشروع','وثائق العمل','استراتيجية المؤسسة'], outputs:['سجل أصحاب المصلحة','تحليل أصحاب المصلحة'], construction:'تحديد العميل والمقاول والجهات الحكومية والمجتمع المحلي والمستثمرين وأي أطراف أخرى لها مصلحة في مشروع الإنشاء' },
  { id:'P3', name:'وضع خطة إدارة المشروع', group:'تخطيط', groupEn:'Planning', tier:2, icon:'📐', desc:'تطوير وثيقة شاملة تحدد كيفية تنفيذ ومراقبة وإدارة المشروع من البداية حتى الإغلاق', inputs:['ميثاق المشروع','سجل أصحاب المصلحة','استراتيجية المؤسسة'], outputs:['خطة إدارة المشروع المتكاملة'], construction:'وضع الخطة الشاملة لمشروع بناء تشمل جميع خطط الفروع: النطاق والجدول والتكاليف والجودة والموارد' },
  { id:'P4', name:'وضع خطة إدارة النطاق', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🎯', desc:'تحديد كيفية تعريف وتوثيق والتحقق من التحكم في نطاق المشروع والمخرجات الرئيسية', inputs:['خطة إدارة المشروع','ميثاق المشروع'], outputs:['خطة إدارة النطاق'], construction:'وضع إجراءات تعريف نطاق المشروع الإنشائي وتوثيق المتطلبات الفنية والإنشائية والتحقق من الإنجاز' },
  { id:'P5', name:'جمع المتطلبات', group:'تخطيط', groupEn:'Planning', tier:1, icon:'📝', desc:'تحديد وتوثيق احتياجات وتوقعات أصحاب المصلحة لتلبية أهداف المشروع ومتطلباته الوظيفية والفنية', inputs:['خطة إدارة النطاق','سجل أصحاب المصلحة','وثائق العقد'], outputs:['متطلبات المشروع','سجل تتبع المتطلبات'], construction:'جمع المتطلبات الفنية من العميل تشمل المواصفات والرسومات والمعايير الإنشائية ومتطلبات السلامة والبيئة' },
  { id:'P6', name:'تحديد نطاق المشروع', group:'تخطيط', groupEn:'Planning', tier:1, icon:'📐', desc:'إعداد وصف تفصيلي للنطاق والمخرجات الرئيسية للمشروع بما في ذلك معايير القبول والاستثناءات', inputs:['خطة إدارة النطاق','متطلبات المشروع'], outputs:['بيان النطاق الأساسي','هيكل تفكيك النطاق'], construction:'تحديد نطاق العمل الإنشائي التفصيلي: المباني والمراحل والطوابق والوحدات والمساحات والمخرجات الدقيقة' },
  { id:'P7', name:'إنشاء هيكل تفكيك العمل', group:'تخطيط', groupEn:'Planning', tier:1, icon:'🗂️', desc:'تفكيك مخرجات النطاق ونطاق المشروع إلى أجزاء أصغر وأكثر سهولة في إدارتها وقياسها', inputs:['بيان النطاق الأساسي','متطلبات المشروع'], outputs:['هيكل تفكيك العمل','بيان النطاق المُحدّث'], construction:'تفكيك مشروع البناء إلى مراحل (أساسات، هيكل، تشطيبات) ثم إلى أنشطة فرعية قابلة للقياس والمتابعة' },
  { id:'P8', name:'وضع خطة إدارة الجدول الزمني', group:'تخطيط', groupEn:'Planning', tier:1, icon:'📅', desc:'تحديد سياسات وإجراءات تطوير وإدارة وتنفيذ ومراقبة الجدول الزمني للمشروع', inputs:['خطة إدارة المشروع','بيان النطاق'], outputs:['خطة إدارة الجدول الزمني'], construction:'وضع سياسات جدول المشروع الإنشائي وطرق تقدير المدد وآليات التعامل مع التأخيرات والتعديلات' },
  { id:'P9', name:'تحديد الأنشطة', group:'تخطيط', groupEn:'Planning', tier:1, icon:'📋', desc:'تحديد وتوثيق الأنشطة المحددة اللازمة لإنجاز كل عنصر في هيكل تفكيك العمل', inputs:['هيكل تفكيك العمل','بيان النطاق'], outputs:['سجل الأنشطة','قائمة المتطلبات'], construction:'تحديد الأنشطة الإنشائية التفصيلية لكل مرحلة مثل: حفر الأساسات، تركيب الهيكل الحديدي، صب الخرسانة' },
  { id:'P10', name:'ترتيب الأنشطة', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🔗', desc:'تحديد وتتبع التبعيات بين أنشطة المشروع وتحديد التسلسل المنطقي للتنفيذ', inputs:['سجل الأنشطة','ممتلكات المؤسسة'], outputs:['شجرة التبعيات','مخطط الشبكة'], construction:'ترتيب الأنشطة الإنشائية: يجب إنجاز الأساسات قبل الهيكل، والهيكل قبل التشطيبات، مع تحديد التبعيات الحرجة' },
  { id:'P11', name:'تقدير مدة الأنشطة', group:'تخطيط', groupEn:'Planning', tier:1, icon:'⏱️', desc:'تقدير عدد فترات العمل اللازمة لإتمام كل نشاط مع أخذ الموارد والقيود بعين الاعتبار', inputs:['سجل الأنشطة','سجل الموارد','ممتلكات المؤسسة'], outputs:['تقديرات المدة'], construction:'تقدير مدد التنفيذ لكل نشاط إنشائي بالساعات أو الأيام بناءً على خبرة المقاول وحجم العمل والموارد المتاحة' },
  { id:'P12', name:'وضع الجدول الزمني', group:'تخطيط', groupEn:'Planning', tier:2, icon:'📆', desc:'تحليل تسلسل الأنشطة ومددتها ومتطلباتها وقيودها لإنشاء نموذج جدول زمني متكامل', inputs:['سجل الأنشطة','تقديرات المدة','شجرة التبعيات'], outputs:['نموذج الجدول الزمني','بيان الجدول الأساسي'], construction:'وضع الجدول الزمني الشامل لمشروع البناء من البداية للتسليم مع تحديد الملفات الحرجة والمحطات الرئيسية' },
  { id:'P13', name:'وضع خطة إدارة التكاليف', group:'تخطيط', groupEn:'Planning', tier:2, icon:'💰', desc:'تحديد كيفية تقدير وتمويل ورقابة وتحكم تكاليف المشروع بحيث تبقى ضمن الميزانية المعتمدة', inputs:['خطة إدارة المشروع','بيان النطاق'], outputs:['خطة إدارة التكاليف'], construction:'وضع سياسات تقدير التكاليف الإنشائية وآليات التحكم في الميزانية والعلاج المالي عند التجاوز' },
  { id:'P14', name:'تقدير التكاليف', group:'تخطيط', groupEn:'Planning', tier:1, icon:'💲', desc:'تقدير التكاليف المالية للموارد اللازمة لإنجاز أنشطة المشروع مع مراعاة التضخم والمخاطر', inputs:['سجل الأنشطة','سجل الموارد','معدلات السوق'], outputs:['تقديرات التكاليف الأساسي'], construction:'تقدير تكاليف المواد الإنشائية والعمالة والمعدات والمقاولين الفرعيين لكل بند من بنود المشروع' },
  { id:'P15', name:'تحديد الميزانية', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🏦', desc:'تجميع تقديرات التكاليف لإنشاء نموذج لتمويل وإدارة الميزانية الرسمية للمشروع', inputs:['تقديرات التكاليف','جدول الزمني','هيكل تفكيك العمل'], outputs:['الميزانية الأساسية','متطلبات التمويل'], construction:'وضع الميزانية الإجمالية لمشروع البناء وتوزيعها على المراحل والبنود مع تحديد السيولة والتدفق المالي' },
  { id:'P16', name:'وضع خطة إدارة الجودة', group:'تخطيط', groupEn:'Planning', tier:2, icon:'✅', desc:'تحديد معايير الجودة المطلوبة للمشروع وكيفية تحقيقها والتحقق منها والتوثيق', inputs:['خطة إدارة المشروع','بيان النطاق'], outputs:['خطة إدارة الجودة'], construction:'وضع معايير الجودة الإنشائية وطرق الفحص والاختبار والتحقق من مطابقة الأعمال للمواصفات والمعايير' },
  { id:'P17', name:'وضع خطة إدارة الموارد', group:'تخطيط', groupEn:'Planning', tier:2, icon:'👷', desc:'تحديد كيفية تحديد وتقدير وحصول وإدارة وانتهاء صلاحية الموارد البشرية والمادية', inputs:['خطة إدارة المشروع','بيان النطاق'], outputs:['خطة إدارة الموارد'], construction:'وضع خطة توفير الكوادر البشرية والمواد والمعدات والآلات الإنشائية اللازمة لكل مرحلة من المشروع' },
  { id:'P18', name:'تقدير موارد الأنشطة', group:'تخطيط', groupEn:'Planning', tier:2, icon:'📊', desc:'تقدير نوع وكمية الموارد البشرية والمادية والمعدات اللازمة لكل نشاط في المشروع', inputs:['سجل الأنشطة','خطة إدارة الموارد'], outputs:['تقديرات الموارد الأساسي'], construction:'تقدير عدد العمال والمعدات والمواد المطلوبة لكل نشاط إنشائي وتحديد أوقات التوريد والتركيب' },
  { id:'P19', name:'وضع خطة إدارة الاتصالات', group:'تخطيط', groupEn:'Planning', tier:2, icon:'📢', desc:'تحديد كيفية تخطيط وتنفيذ وإدارة واستمرارية الاتصالات بين جميع الأطراف المعنية', inputs:['خطة إدارة المشروع','سجل أصحاب المصلحة'], outputs:['خطة إدارة الاتصالات'], construction:'وضع نظام الاتصالات للمشروع يشمل الاجتماعات الدورية والتقارير اليومية والتواصل مع العميل والجهات الحكومية' },
  { id:'P20', name:'وضع خطة إدارة المخاطر', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🛡️', desc:'تحديد كيفية تنفيذ أنشطة إدارة المخاطر في المشروع من التحديد والاستجابة والمراقبة', inputs:['خطة إدارة المشروع','سجل أصحاب المصلحة'], outputs:['خطة إدارة المخاطر'], construction:'وضع خطة إدارة مخاطر المشروع الإنشائي تشمل مخاطر التأخير وارتفاع الأسعار والأحوال الجوية والسلامة' },
  { id:'P21', name:'تحديد المخاطر', group:'تخطيط', groupEn:'Planning', tier:1, icon:'⚠️', desc:'تحديد وتوثيق المخاطر التي قد تؤثر على أهداف المشروع وتحليل خصائصها', inputs:['خطة إدارة المخاطر','بيان النطاق','سجل أصحاب المصلحة'], outputs:['سجل المخاطر'], construction:'تحديد مخاطر المشروع الإنشائي: التأخر في التوريد، تغيّر أسعار المواد، ظروف جوية صعبة، مشاكل التربة' },
  { id:'P22', name:'التحليل النوعي للمخاطر', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🔍', desc:'ترتيب وتصنيف مخاطر المشروع حسب تأثيرها المحتمل واحتمالية وقوعها لتحديد الأولويات', inputs:['سجل المخاطر','بيان النطاق'], outputs:['تحليل المخاطر الأساسي'], construction:'تصنيف مخاطر المشروع حسب شدتها واحتمالية وقوعها لتحديد المخاطر الحرجة التي تتطلب خطط استجابة فورية' },
  { id:'P23', name:'التحليل الكمي للمخاطر', group:'تخطيط', groupEn:'Planning', tier:2, icon:'📈', desc:'تحليل التأثير الرقمي المحتمل للمخاطر على أهداف المشروع باستخدام نماذج احصائية', inputs:['سجل المخاطر','النموذج المالي'], outputs:['تحليل التأثير الكمي'], construction:'حساب التأثير المالي الكمي للمخاطر على ميزانية المشروع والجدول الزمني باستخدام تحليل السيناريوهات' },
  { id:'P24', name:'وضع خطط الاستجابة للمخاطر', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🚨', desc:'تطوير خيارات واستراتيجيات وإجراءات لمعالجة مخاطر المشروع وتحقيق الأهداف المرجوة', inputs:['سجل المخاطر','تحليل المخاطر الأساسي'], outputs:['خطط استجابة المخاطر','خطة إدارة المخاطر المحدّثة'], construction:'وضع خطط استجابة لمخاطر البناء: التأمين، الفئات الاحتياطية، تعديل الجدول، تنويع الموردين' },
  { id:'P25', name:'وضع خطة إدارة المشتريات', group:'تخطيط', groupEn:'Planning', tier:1, icon:'🛒', desc:'تحديد كيفية إدارة عمليات الشراء الخارجية للمشروع من تحديد الاحتياجات حتى إنهاء العقود', inputs:['خطة إدارة المشروع','بيان النطاق','سجل المخاطر'], outputs:['خطة إدارة المشتريات','مقالات العمل'], construction:'وضع خطة مشتريات المواد والخدمات الإنشائية وآليات المناقصة واختيار الموردين وإدارة العقود' },
  { id:'P26', name:'وضع خطة إدارة تفاعل أصحاب المصلحة', group:'تخطيط', groupEn:'Planning', tier:2, icon:'🤝', desc:'تحديد الاستراتيجيات والأنشطة المناسبة لإدارة مساهمة وتفاعل أصحاب المصلحة بشكل فعال', inputs:['خطة إدارة المشروع','سجل أصحاب المصلحة'], outputs:['خطة إدارة تفاعل أصحاب المصلحة'], construction:'وضع خطة التواصل الفعال مع العميل والمقاولين الفرعيين والجهات الحكومية والمجتمع المحلي' },
  { id:'P27', name:'توجيه وإدارة العمل', group:'تنفيذ', groupEn:'Executing', tier:2, icon:'🏗️', desc:'تنفيذ العمل المخطط له في وثائق خطة إدارة المشروع وتسجيل بيانات الأداء الفعلية', inputs:['خطة إدارة المشروع','بيانات الأداء'], outputs:['المخرجات الفعلية','بيانات أداء العمل'], construction:'تنسيق وإدارة الأعمال الإنشائية الفعلية في الموقع وفقاً للخطط المعتمدة والمواصفات الفنية' },
  { id:'P28', name:'إدارة المعرفة', group:'تنفيذ', groupEn:'Executing', tier:1, icon:'📚', desc:'استخدام ومشاركة المعرفة المكتسبة من إدارة المشروع لإنشاء معرفة جديدة وتسهيل التعلم المؤسسي', inputs:['خطة إدارة المشروع','الخبرات المكتسبة'], outputs:['دروس مستفادة','قاعدة معرفية'], construction:'توثيق الدروس المستفادة من المشاكل الإنشائية والحلول الإبداعية للاستفادة منها في المشاريع المستقبلية' },
  { id:'P29', name:'إدارة الجودة', group:'تنفيذ', groupEn:'Executing', tier:1, icon:'🏅', desc:'تنفيذ أنشطة الجودة المخططة لضمان أن العمل مكتمل بالشكل الصحيح مع الحد من الأخطاء', inputs:['خطة إدارة الجودة','بيانات الأداء'], outputs:['تقارير الفحص','تغييرات جودة'], construction:'تنفيذ فحوصات الجودة الإنشائية واختبارات الخرسانة والصلب والطوب والتشطيبات وتوثيق النتائج' },
  { id:'P30', name:'توظيف الموارد', group:'تنفيذ', groupEn:'Executing', tier:1, icon:'📦', desc:'الحصول على الأفراد والمعدات والمواد والمرافق اللازمة لإنجاز أعمال المشروع', inputs:['خطة إدارة الموارد','تقديرات الموارد'], outputs:['مورد المشروع الأساسي'], construction:'توظيف فرق العمل الإنشائية وتأجير المعدات وتوريد المواد والمواد البنائية اللازمة للمشروع' },
  { id:'P31', name:'تطوير الفريق', group:'تنفيذ', groupEn:'Executing', tier:1, icon:'🎓', desc:'تحسين مهارات وخبرات وبيئة عمل أفراد الفريق لزيادة كفاءتهم وفعالية أدائهم', inputs:['خطة إدارة الموارد','بيانات الأداء'], outputs:['تحسن أداء الفريق'], construction:'تدريب فرق العمل على تقنيات البناء الحديثة ومهارات السلامة وإدارة الموقع الفعالة' },
  { id:'P32', name:'إدارة الفريق', group:'تنفيذ', groupEn:'Executing', tier:1, icon:'👥', desc:'متابعة أداء أعضاء الفريق وتقييمهم ومعالجة المشاكل وحل النزاعات وتحسين التعاون', inputs:['بيانات أداء الفريق','تقارير الأداء'], outputs:['تحديثات خطة الموارد'], construction:'متابعة أداء العمال والمهندسين في الموقع ومعالجة المشاكل والنزاعات وتحفيز الفريق على الإنجاز' },
  { id:'P33', name:'إدارة الاتصالات', group:'تنفيذ', groupEn:'Executing', tier:2, icon:'💬', desc:'إنشاء وجمع وتوزيع وتخزين المعلومات المرتبطة بالمشروع للأطراف المناسبة في الوقت المناسب', inputs:['خطة إدارة الاتصالات','بيانات الأداء'], outputs:['سجلات الاتصالات','تقارير دورية'], construction:'إدارة اتصالات الموقع اليومية: الاجتماعات الأسبوعية والتقارير اليومية والتواصل مع العميل والموردين' },
  { id:'P34', name:'إدارة تفاعل أصحاب المصلحة', group:'تنفيذ', groupEn:'Executing', tier:2, icon:'🤝', desc:'ال التواصل والعمل مع أصحاب المصلحة لتلبية احتياجاتهم ومعالجة مخاوفهم وتعزيز مشاركتهم الفعالة', inputs:['خطة إدارة تفاعل أصحاب المصلحة','سجل أصحاب المصلحة'], outputs:['تغييرات في أصحاب المصلحة'], construction:'إدارة العلاقة مع العميل والجهات الحكومية والمجتمع المحلي وحل أي مشاكل أو مخاوف تطرح' },
  { id:'P35', name:'مراقبة الأداء', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'📊', desc:'تتبع وتقييم وتقرير التقدم مقارنة بأهداف خطة إدارة المشروع لتحديد الانحرافات والإجراءات التصحيحية', inputs:['خطة إدارة المشروع','بيانات الأداء','التقارير الدورية'], outputs:['تقارير الأداء','طلب التغيير'], construction:'مراقبة تقدم العمل الإنشائي مقارنة بالجدول والميزانية ومعالجة أي انحرافات أو تأخيرات فوراً' },
  { id:'P36', name:'التحكم المتكامل في التغييرات', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'🔄', desc:'مراجعة وقبول أو رفض أو تتبع جميع التغييرات الرسمية على مخرجات المشروع ووثائق التخطيط', inputs:['طلب التغيير','تقييم التغيير'], outputs:['قرارات التغيير','تحديثات خطة إدارة المشروع'], construction:'إدارة التغييرات في نطاق أو جدول أو تكاليف المشروع الإنشائي مع تقييم تأثيرها ومعالجتها رسمياً' },
  { id:'P37', name:'التحقق من النطاق', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'✔️', desc:'التحقق من أن المخرجات المكتملة تلبي المتطلبات وتوثيقها وقبولها من أصحاب المصلحة المعنيين', inputs:['بيان النطاق الأساسي','بيانات الأداء'], outputs:['قبول النطاق','تحديثات النطاق'], construction:'التحقق من انجاز الأعمال الإنشائية وفقاً للمواصفات المعتمدة وتوثيق قبول العميل لكل مرحلة' },
  { id:'P38', name:'التحكم في النطاق', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'📏', desc:'مراقبة حالة النطاق وتسجيل تغييرات النطاق وفحصها والتحكم فيها لمنع الامتداد غير المبرر', inputs:['بيان النطاق الأساسي','بيانات الأداء'], outputs:['طلب التغيير','تحديثات نطاق'], construction:'التأكد من عدم تجاوز نطاق العمل الإنشائي المتفق عليه ومعالجة أي إضافات أو حذف بشكل رسمي' },
  { id:'P39', name:'التحكم في الجدول الزمني', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:2, icon:'⏰', desc:'مراقبة حالة تنفيذ الجدول الزمني وتحديثه وإدارة التغييرات عليه لضمان إنجاز المشروع في الوقت', inputs:['بيان الجدول الأساسي','بيانات الأداء'], outputs:['طلب التغيير','تحديثات الجدول'], construction:'مراقبة تقدم الأعمال الإنشائية مقارنة بالجدول الزمني واتخاذ إجراءات لمعالجة التأخيرات' },
  { id:'P40', name:'التحكم في التكاليف', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:2, icon:'💶', desc:'مراقبة حالة المشروع وتأكيد التغييرات على الميزانية الأساسية وتطبيق الإجراءات التصحيحية', inputs:['الميزانية الأساسية','بيانات الأداء'], outputs:['طلب التغيير','تقديرات التكاليف المحدّثة'], construction:'مراقبة نفقات المشروع الإنشائي مقارنة بالميزانية واتخاذ إجراءات للتحكم في تجاوزات التكلفة' },
  { id:'P41', name:'مراقبة الجودة', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'🔍', desc:'مراقبة وتسجيل نتائج أنشطة تنفيذ الجودة لضمان استخدام المعايير والمواصفات المناسبة', inputs:['خطة إدارة الجودة','بيانات الأداء'], outputs:['تقارير الجودة','طلبات التصحيح'], construction:'فحص جودة الأعمال الإنشائية واختبارات الخرسانة والمواد والتأكد من مطابقة التصاميم والمواصفات' },
  { id:'P42', name:'مراقبة الموارد', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:2, icon:'📦', desc:'مراقبة الحالة الفعلية للموارد المخصصة ومقارنة التخصيص بالحاجة الفعلية ومعالجة الفروقات', inputs:['خطة إدارة الموارد','بيانات الأداء'], outputs:['تقارير الموارد','طلبات التغيير'], construction:'مراقبة توفر واستخدام المواد والعمالة والمعدات الإنشائية والتأكد من كفاءة التخصيص والصرف' },
  { id:'P43', name:'مراقبة المخاطر', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:2, icon:'🛡️', desc:'تتبع المخاطر المحددة ومراقبة المخاطر المحتملة وتقديم فعالية خطط الاستجابة وتقديم التقييمات', inputs:['سجل المخاطر','خطط الاستجابة'], outputs:['تحديثات سجل المخاطر','طلبات التغيير'], construction:'مراقبة مخاطر المشروع الإنشائية المستمرة مثل تغير الأسعار والتأخيرات الجوية ومشاكل التربة' },
  { id:'P44', name:'مراقبة المشتريات', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:2, icon:'📋', desc:'إدارة ومراقبة وتنظيم وتنقيح عقود المشتريات والتحقق من أداء الموردين والمقاولين الفرعيين', inputs:['عقود المشتريات','بيانات الأداء'], outputs:['تقارير أداء المشتريات','طلبات التغيير'], construction:'مراقبة التزامات الموردين والمقاولين الفرعيين من حيث الجودة والكمية والجدول الزمني وفقاً للعقود' },
  { id:'P45', name:'مراقبة تفاعل أصحاب المصلحة', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'👁️', desc:'تتبع وتقييم مستوى تفاعل ومشاركة أصحاب المصلحة وتعديل استراتيجيات التفاعل حسب الحاجة', inputs:['خطة إدارة تفاعل أصحاب المصلحة','بيانات الأداء'], outputs:['تحديثات خطة التفاعل'], construction:'تقييم رضا العميل والتواصل المستمر مع جميع الأطراف المعنية ومعالجة أي مشاكل في العلاقة' },
  { id:'P46', name:'تقرير أداء المشروع', group:'متابعة وتحكم', groupEn:'Monitoring & Controlling', tier:1, icon:'📄', desc:'جمع وتجميع وتوزيع معلومات الأداء لضمان وصول التقارير للمعنيين بشكل دقيق وفي الوقت المناسب', inputs:['بيانات الأداء','تحليل الانحرافات'], outputs:['تقارير الأداء الدورية','التقارير الفنية'], construction:'إعداد تقارير دورية عن تقدم المشروع الإنشائي تشمل النسبة المئوية للإنجاز والتكاليف والجودة والسلامة' },
  { id:'P47', name:'إغلاق المشتريات', group:'إغلاق', groupEn:'Closing', tier:2, icon:'📝', desc:'إنهاء جميع أنشطة وعمليات المشتريات لكل عقود المشروع بما في ذلك تسوية أي نزاعات أو منازعات', inputs:['عقود المشتريات','تقارير الأداء'], outputs:['إغلاق المشتريات','الدروس المستفادة من المشتريات'], construction:'إنهاء عقود التوريد والمقاولات الفرعية وإتمام التسوية المالية والتوثيق النهائي' },
  { id:'P48', name:'إغلاق المشروع أو المرحلة', group:'إغلاق', groupEn:'Closing', tier:2, icon:'🏁', desc:'إنهاء جميع أنشطة المشروع أو المرحلة وتوثيق النتائج النهائية والاحتفاظ بالسجلات', inputs:['المخرجات المقبولة','سجلات المشروع'], outputs:['إغلاق المشروع','التوثيق النهائي','الدروس المستفادة'], construction:'إنهاء جميع الأعمال الإنشائية وتوثيق التسليم النهائي للمشروع وإغلاق السجلات المالية والفنية' },
  { id:'P49', name:'توثيق الدروس المستفادة', group:'إغلاق', groupEn:'Closing', tier:2, icon:'📖', desc:'جمع وتحليل وتوثيق الدروس المستفادة من جميع مراحل المشروع لتعميم المعرفة وتحسين المشاريع المستقبلية', inputs:['جميع سجلات المشروع','خبرات الفريق'], outputs:['تقرير الدروس المستفادة','قاعدة المعرفة'], construction:'توثيق تجارب مشروع البناء من حيث التحديات والحلول والابتكارات للاستفادة منها في مشاريع المقاولات القادمة' }
];

NEXORA.Views.Processes = {
  render: function() {
    var App = NEXORA.App;
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;
    var cu = App.cu;
    var el = document.getElementById('processesContent');
    if (!el) return;

    var tier = NEXORA.Views.Processes.getTier();
    var procs = NEXORA.Views.Processes.getFilteredProcesses();
    var pid = App.curProjId;
    var proj = pid ? H.proj(pid) : null;

    var completed = 0, inProgress = 0, pending = 0;
    procs.forEach(function(p) {
      var st = NEXORA.Views.Processes.getProcessStatus(p.id, pid);
      if (st === 'done') completed++;
      else if (st === 'in_progress') inProgress++;
      else pending++;
    });
    var total = procs.length;
    var progPct = total ? Math.round(completed / total * 100) : 0;

    var projOptions = '<option value="">— بدون مشروع —</option>';
    DB.projects.forEach(function(p) {
      projOptions += '<option value="' + p.id + '"' + (pid == p.id ? ' selected' : '') + '>' + H.esc(p.name) + '</option>';
    });

    var h = '<div class="card" style="border-right:4px solid var(--P);">' +
      '<div class="flex-between">' +
        '<div><div class="card-title"><i class="ti ti-engineering"></i> محرك العمليات PMBOK</div>' +
          '<div style="font-size:var(--fs-sm);color:var(--TX2);">الوضع: <strong style="color:' + (tier === 1 ? 'var(--GR)' : 'var(--P)') + ';">' + (tier === 1 ? '⚡ بسيط (Tier 1)' : '🏢 مؤسسي (Tier 2)') + '</strong></div></div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<select id="procProjSelect" style="width:auto;min-width:180px;margin:0;" onchange="NEXORA.Views.Processes._onProjectChange(this.value)">' + projOptions + '</select>' +
          '<button class="btn btn-sm btn-o" onclick="NEXORA.Views.Processes._toggleTier()" title="تبديل الوضع">' + (tier === 1 ? '🏢 انتقال للمؤسسي' : '⚡ انتقال للبسيط') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    h += '<div class="stats">' +
      '<div class="stat-card green"><div class="num">' + completed + '</div><div class="lbl">مكتملة</div></div>' +
      '<div class="stat-card blue"><div class="num">' + inProgress + '</div><div class="lbl">جارية</div></div>' +
      '<div class="stat-card gold"><div class="num">' + pending + '</div><div class="lbl">قيد الانتظار</div></div>' +
      '<div class="stat-card purple"><div class="num">' + progPct + '%</div><div class="lbl">التقدم الإجمالي</div></div>' +
    '</div>';

    h += '<div class="card" style="padding:14px 16px;margin-bottom:14px;">' +
      '<div class="progress-bar" style="height:10px;"><div class="progress-fill ' + (progPct >= 75 ? 'green' : progPct >= 40 ? 'gold' : 'blue') + '" style="width:' + progPct + '%"></div></div>' +
    '</div>';

    h += '<div class="tab-bar" id="procGroupTabs">';
    h += '<button class="tab-btn active" onclick="filterProcGroup(\'all\',this)">الكل (' + procs.length + ')</button>';
    PMBOK_GROUPS.forEach(function(g) {
      var count = procs.filter(function(p) { return p.group === g.name; }).length;
      if (count > 0) {
        h += '<button class="tab-btn" onclick="filterProcGroup(\'' + H.esc(g.name) + '\',this)"><i class="' + g.icon + '"></i> ' + g.name + ' (' + count + ')</button>';
      }
    });
    h += '</div>';

    h += '<div id="procGroupContent"></div>';

    el.innerHTML = h;
    NEXORA.Views.Processes.filterGroup('all', document.querySelector('#procGroupTabs .tab-btn'));
  },

  filterGroup: function(group, btn) {
    var H = NEXORA.Helpers;
    var pid = NEXORA.App.curProjId;
    var procs = NEXORA.Views.Processes.getFilteredProcesses();

    document.querySelectorAll('#procGroupTabs .tab-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    var filtered = group === 'all' ? procs : procs.filter(function(p) { return p.group === group; });
    var gc = document.getElementById('procGroupContent');
    if (!gc) return;

    var h = '';
    PMBOK_GROUPS.forEach(function(g) {
      var groupProcs = filtered.filter(function(p) { return p.group === g.name; });
      if (!groupProcs.length) return;

      var groupCompleted = groupProcs.filter(function(p) { return NEXORA.Views.Processes.getProcessStatus(p.id, pid) === 'done'; }).length;
      var groupPct = groupProcs.length ? Math.round(groupCompleted / groupProcs.length * 100) : 0;

      h += '<div class="card" style="border-right:4px solid ' + g.color + ';">' +
        '<div class="flex-between" style="margin-bottom:10px;">' +
          '<div class="card-title" style="margin:0;color:' + g.color + ';"><i class="' + g.icon + '"></i> ' + g.name + ' <span style="font-size:var(--fs-sm);color:var(--TX2);font-weight:400;">(' + g.nameEn + ')</span></div>' +
          '<span style="font-size:var(--fs-sm);color:var(--TX2);">' + groupCompleted + '/' + groupProcs.length + '</span>' +
        '</div>' +
        '<div class="progress-bar" style="margin-bottom:12px;"><div class="progress-fill ' + (groupPct >= 75 ? 'green' : groupPct >= 40 ? 'gold' : 'blue') + '" style="width:' + groupPct + '%"></div></div>';

      groupProcs.forEach(function(p) {
        var st = NEXORA.Views.Processes.getProcessStatus(p.id, pid);
        var stCls = st === 'done' ? 'badge-done' : st === 'in_progress' ? 'badge-progress' : 'badge-todo';
        var stLabel = st === 'done' ? '✓ مكتمل' : st === 'in_progress' ? '◉ جاري' : '○ قيد الانتظار';
        var tierBadge = p.tier === 1 ? '<span style="background:var(--GR);color:#fff;border-radius:999px;padding:1px 6px;font-size:10px;margin-right:4px;">T1</span>' : '<span style="background:var(--P);color:#fff;border-radius:999px;padding:1px 6px;font-size:10px;margin-right:4px;">T2</span>';

        h += '<div class="list-item" style="cursor:pointer;flex-wrap:wrap;" onclick="NEXORA.App.curProcessId=\'' + p.id + '\';showView(\'processDetail\')">' +
          '<div class="info">' +
            '<strong>' + tierBadge + p.icon + ' ' + H.esc(p.name) + '</strong>' +
            '<small style="color:var(--TX3);">' + p.id + '</small>' +
            '<small style="color:var(--TX3);">' + H.esc(p.desc.substring(0, 80)) + '...</small>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:6px;">' +
            '<span class="badge ' + stCls + '">' + stLabel + '</span>' +
            (pid ? '<div style="display:flex;gap:3px;">' +
              '<button class="btn btn-sm ' + (st === 'in_progress' ? 'btn-warning' : 'btn-o') + '" onclick="event.stopPropagation();setProcessStatus(\'' + p.id + '\',' + pid + ',\'in_progress\',\'\')" title="جاري">◉</button>' +
              '<button class="btn btn-sm ' + (st === 'done' ? 'btn-success' : 'btn-o') + '" onclick="event.stopPropagation();setProcessStatus(\'' + p.id + '\',' + pid + ',\'done\',\'\')" title="مكتمل">✓</button>' +
              '<button class="btn btn-sm ' + (st === 'pending' ? 'btn-o' : 'btn-o') + '" onclick="event.stopPropagation();setProcessStatus(\'' + p.id + '\',' + pid + ',\'pending\',\'\')" title="قيد الانتظار">○</button>' +
            '</div>' : '') +
          '</div>' +
        '</div>';
      });

      h += '</div>';
    });

    gc.innerHTML = h || '<div class="empty-state"><i class="ti ti-engineering"></i>لا توجد عمليات في هذا التصنيف</div>';
  },

  getTier: function() {
    try {
      var t = localStorage.getItem('nexora_proc_tier');
      return t ? parseInt(t) : 1;
    } catch (e) { return 1; }
  },

  getFilteredProcesses: function() {
    var tier = NEXORA.Views.Processes.getTier();
    if (tier === 1) return PMBOK_CATALOG.filter(function(p) { return p.tier === 1; });
    return PMBOK_CATALOG.slice();
  },

  getProcessStatus: function(pid, projId) {
    var DB = NEXORA.DB;
    if (!projId) return 'pending';
    var proc = DB.processes.find(function(p) { return p.process_id === pid && p.project_id === projId; });
    return proc ? proc.status : 'pending';
  },

  setProcessStatus: function(pid, projId, status, note) {
    var DB = NEXORA.DB;
    var H = NEXORA.Helpers;

    if (!projId) {
      if (typeof showToast === 'function') showToast('اختر مشروع أولاً', 'warning');
      return;
    }

    var proc = DB.processes.find(function(p) { return p.process_id === pid && p.project_id === projId; });
    if (proc) {
      proc.status = status;
      proc.updated_at = new Date().toISOString();
    } else {
      DB.processes.push({
        id: H.gf(DB.processes),
        process_id: pid,
        project_id: projId,
        status: status,
        note: note || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    DB.process_logs.push({
      id: H.gf(DB.process_logs),
      process_id: pid,
      project_id: projId,
      status: status,
      note: note || '',
      changed_by: NEXORA.App.cu ? NEXORA.App.cu.id : 0,
      changed_at: new Date().toISOString()
    });

    DB.save();
    NEXORA.Views.Processes.render();
  },

  _onProjectChange: function(val) {
    NEXORA.App.curProjId = val ? parseInt(val) : null;
    NEXORA.Views.Processes.render();
  },

  _toggleTier: function() {
    var current = NEXORA.Views.Processes.getTier();
    var next = current === 1 ? 2 : 1;
    try { localStorage.setItem('nexora_proc_tier', next); } catch (e) {}
    NEXORA.Views.Processes.render();
    if (typeof showToast === 'function') showToast(next === 1 ? 'الوضع البسيط: العمليات الأساسية فقط' : 'الوضع المؤسسي: جميع عمليات PMBOK الـ 49', 'info');
  }
};

window.renderProcesses = function() { NEXORA.Views.Processes.render(); };
window.filterProcGroup = function(g, b) { NEXORA.Views.Processes.filterGroup(g, b); };
window.setProcessStatus = function(p, pi, s, n) { NEXORA.Views.Processes.setProcessStatus(p, pi, s, n); };
