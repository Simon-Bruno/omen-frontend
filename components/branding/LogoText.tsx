import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React from 'react';

interface LogoProps {
    src?: string;
    alt?: string;
    width?: number;
    height?: number;
    onClick?: () => void;
}

const LogoText: React.FC<LogoProps> = ({
    src = '/assets/logo-text.png',
    alt = 'Omen',
    width = 100,
    height = 32,
    onClick,
}) => {
    const router = useRouter();
    return (
        <div className="flex-shrink-0">
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="h-8 w-auto cursor-pointer object-contain"
                style={{ objectPosition: 'bottom' }}
                priority
                onClick={onClick ? onClick : () => {
                    router.push('/dashboard/projects');
                }}
            />
        </div>
    );
};

export default LogoText;