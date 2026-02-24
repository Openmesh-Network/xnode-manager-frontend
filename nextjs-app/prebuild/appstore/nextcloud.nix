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
            services.nextcloud.hostName = "nextcloud.openmesh.network";
            services.nextcloud.config.adminpassFile = builtins.toString (
              pkgs.writeText "nextcloud.password" "xnode"
            );
            # END USER CONFIG

            services.nextcloud.enable = true;
            services.nextcloud.https = true;
            services.nextcloud.config.dbtype = "sqlite";
            services.nextcloud.settings.trusted_proxies = [ "192.168.0.0" ];

            networking.firewall.allowedTCPPorts = [ 80 ];
          }
        )
      ];
    };
  };
}
