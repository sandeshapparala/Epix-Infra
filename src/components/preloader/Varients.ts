export const letterVariants = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    hidden: (i: number) => ({
        opacity: 0,
        y: 50,
        rotateX: -90,
        transition: {
            duration: 0.05, // Reduced duration
        }
    }),
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        rotateX: 0,
        transition: {
            duration: 0.2, // Reduced duration
            ease: [0.6, 0.01, 0.05, 0.95],
            delay: i * 0.05, // Reduced delay
        },
    }),
    exit: (isLeft: boolean) => ({
        x: isLeft ? -100 : 100,
        y: 0,
        opacity: 0,
        scale: 1.5,
        rotate: isLeft ? -45 : 45,
        transition: {
            duration: 0.3, // Reduced duration
            ease: [0.6, 0.01, 0.05, 0.95],
        },
    }),
};

export const containerVariants = {
    hidden: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02, // Reduced stagger
            staggerDirection: -1,
        }
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.03, // Reduced stagger
            delayChildren: 0.1, // Reduced delay
            when: "beforeChildren",
        },
    },
    exit: {
        opacity: 1,
        transition: {
            staggerChildren: 0.025, // Reduced stagger
            staggerDirection: -1,
            when: "afterChildren",
        },
    },
};

export const pageVariants = {
    hidden: {
        opacity: 0,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4, // Reduced duration
            ease: [0.6, 0.01, 0.05, 0.95],
            when: "beforeChildren",
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.3, // Reduced duration
            ease: [0.6, 0.01, 0.05, 0.95],
        },
    },
};

export const mainContentVariants = {
    hidden: {
        opacity: 0,
        y: 20,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3, // Reduced duration
            ease: [0.6, 0.01, 0.05, 0.95],
        },
    },
};