{
  inputs = {
    xnode-manager.url = "github:Openmesh-Network/xnode-manager";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs: {
    nixosConfigurations.container = inputs.nixpkgs.lib.nixosSystem {
      specialArgs = {
        inherit inputs;
      };
      modules = [
        inputs.xnode-manager.nixosModules.container
        {
          services.xnode-container.xnode-config = {
            host-platform = ./xnode-config/host-platform;
            state-version = ./xnode-config/state-version;
            hostname = ./xnode-config/hostname;
          };
        }
        (
          { pkgs, ... }@args:
          {
            # START USER CONFIG
            services.vaultwarden.config.DOMAIN = "https://vaultwarden.openmesh.network";
            services.vaultwarden.config.SIGNUPS_ALLOWED = true;
            # END USER CONFIG

            services.vaultwarden.enable = true;
            services.vaultwarden.config.ROCKET_ADDRESS = "0.0.0.0";
            services.vaultwarden.config.ROCKET_PORT = 8000;

            networking.firewall.allowedTCPPorts = [ args.config.services.vaultwarden.config.ROCKET_PORT ];
          }
        )
      ];
    };
  };
}
